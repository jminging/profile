#!/bin/sh

SCRIPT_NAME=${0##*/}
WORKING_DIR=$(dirname "$0")
SED_PATTERN_FILE="${WORKING_DIR}/patterns.sed"

_IFS=${IFS}
IFS="
"


# Removes the header and modifies the format for use with this script
strip_file_header() {
	grep -v '^$\|^#\|^;' "$1"
}
## encode params
encode_str() {
	echo "$1" | sed 's/\./@/g' | sed 's/\*/\\\*/g'
}

## decode result
decode_str() {
	echo "$1" | sed 's/@/\./g' | sed 's/\\\*/\*/g'
}

DEBUG() {
	local curtime;
  curtime=`date +"%Y/%m/%d %H:%M:%S"`
	echo "\033[1;32m[$curtime] DEBUG: $* \033[0m" > /dev/stderr 2>&1
}
#lines=$(cat "Rewrite/ad_rewrite.conf" | grep -Ev "^$|[#;]" | grep -v "^hostname")

merge_list() {
	L1="$1"
	L2="$2"
	ADD_MARK="${3}"
	DEBUG "merge_list params count: $#, ---> L1:${L1}, L2:${L2}, MARK:[${ADD_MARK}]"
	if [ -z "${L1}" -a -z "${L2}" ]; then
		echo ""
		return
	elif [ -z "${L1}" ]; then
	    echo "${L2}"
	    return
	elif [ -z "${L2}" ]; then
	    echo "${L1}"
	  	return
	fi
#	local _IFS=${IFS}
#	IFS=" "
	local _R=
	DEBUG "merge_list ${L1} ${L2}"
	for t1 in ${L1}; do
		for t2 in ${L2}; do
			_R="${_R} ${t1}${ADD_MARK}${t2}"
		done
	done
	_R=$(echo ${_R} | sed 's/^ //g')
#	IFS=${_IFS}
	echo "${_R}"
}

dot_parse() {
	local SUB="$1"
	DEBUG "     DEBUG[dot_parse]: ${SUB}"
	echo "${SUB}" | grep "[?|()]" > /dev/null 2>&1
	if [ $? -ne 0 ]; then
		echo "${SUB}"
		return
	fi

	local TEMP_SUB="${SUB}"
	while true ; do
		echo "${TEMP_SUB}" | grep "[?|()]" > /dev/null 2>&1
		if [ $? -ne 0 ]; then
			break;
		fi

		# 处理（）
		DEBUG "     DEBUG[dot_parse]: process ()"
		local R=$(echo "${TEMP_SUB}" | cut -d '(' -f2 | cut -d ')' -f1 | sed 's/\|/@/g')
#		DEBUG "R: $R"
		local _RET=
		for com in ${R}; do
			local PAT=$(echo "($R)" | sed 's/@/\|/g')
			local _tmp=$(echo ${TEMP_SUB} | sed "s/${PAT}/${com}/g")
			DEBUG "          PATTERN: $PAT  com: $com LINE: ${TEMP_SUB}, RESULT: ${_tmp}"
			_RET="${_RET} ${_tmp}"
		done
		TEMP_SUB=$(echo ${_RET} | sed 's/^ //g')
		DEBUG "     DEBUG[dot_parse]: process () RESULT:${TEMP_SUB}"

		# 处理？
		DEBUG "     DEBUG[dot_parse]: process ?"
		_RET=
		local MARK_L=$(echo "${TEMP_SUB}" | cut -d '?' -f1)
		local MARK_R=$(echo "${TEMP_SUB}" | cut -d '?' -f2)
		if [ "x${MARK_L}" != "x${TEMP_SUB}" ]; then
			DEBUG "     DEBUG[dot_parse]: MARK_L: ${MARK_L}"
			local _tmp=$(dot_parse "${MARK_L}")
			_RET="${MARK_R} ${_tmp}${MARK_R}"
			DEBUG "     DEBUG[dot_parse]: process ? RESULT: ${_RET}"

			if [ "${TEMP_SUB}" != "${SUB}" ]; then
				TEMP_SUB=$(merge_list "${TEMP_SUB}" "${_RET}" "")
			else
				TEMP_SUB="${_RET}"
			fi
		fi

		echo "${TEMP_SUB}"
		break
	done

	DEBUG "     [dot_parse] RESULT:${TEMP_SUB}"
}



# (sdk|wb)app.uve.weibo.com(
# *.(my10api|(.*91.*)).(com|tips|app|xyz)(:d{2,5})?
# m?api.weibo.c(n|om)
regex_line() {
	LINE=$(encode_str "$1")

	local _IFS="$IFS"
	IFS="@"
	local RESULT=""
	local idx=1
	for dot in ${LINE}; do
		DEBUG "-------LINE[${idx}]: ${LINE}, dot:" "${dot}"
		local _RESULT=$(dot_parse "${dot}" | sed 's/ /@/g')
		if [ -z "${RESULT}" ]; then
			RESULT="${_RESULT}"
		else
#			local tmp=
			RESULT=$(merge_list "${RESULT}" "${_RESULT}" ".")
			RESULT=$(echo "${RESULT}" | sed 's/ /@/g')
#			for R in ${RESULT}; do
#				for _R in ${_RESULT}; do
#					tmp="${tmp} ${R}.${_R}"
#				done
#			done
#			RESULT=$(echo ${tmp} | sed 's/^ //g' | sed 's/ /@/g')
		fi
		DEBUG "+++++++LINE[${idx}]: ${LINE}, dot: ${dot}, RESULT: ${RESULT}"
		idx=$(($idx+1))
	done

	## print result
	for r in ${RESULT}; do
		echo "${r}"
	done
	DEBUG "   ------RESULT: ${RESULT}"

#	echo "${RESULT}"
	IFS="${_IFS}"
}

url2domain() {
	url=$1
	echo "${url}" | grep "\." > /dev/null 2>&1
  if [ $? -ne 0 ]; then
  	echo ""
  	return
  fi
  HOST=$(echo "${url}" | sed -e "${PATTERNS}" | awk -F'//' '{print $2}' | awk -F'/' '{print $1}' | cut -d ':' -f1 | sed 's/($//')
  echo "${HOST}" | grep "\." > /dev/null 2>&1
  if [ $? -ne 0 ]; then
  	echo ""
  	return
  fi

  IS_REGEX=$(echo "${HOST}" | grep "[?|()]")
  if [ -z "${IS_REGEX}" ]; then
  	echo "${HOST}"
#		echo ""
  else
  	regex_line "${HOST}"
  fi
}

main() {
#	lines=$(strip_file_header "Rewrite/ad_rewrite.conf")
#	lines=$(strip_file_header "Rewrite/vip_rewrite.conf")
  lines=$(strip_file_header "Rewrite/Rewrite.txt")

	TMP_FILE=$(mktemp)
	for line in ${lines}; do
		url=$(echo ${line} | awk '{print $1}')
		domain=$(url2domain "${url}")
		if [ -z "${domain}" ]; then
			continue
		fi
		echo "${domain}" | sed 's/\\\*/\*/g' >> ${TMP_FILE}
	done

	HOSTS=$(cat "${TMP_FILE}" | grep -v "^$" | sort | uniq | tr '\n' ',' | sed 's/,$//g' | sed 's/,/, /g' | sed 's/\*/\\\*/g' | sed 's/(/\\(/g')
	echo ${HOSTS}
	sed -ie "s/^hostname =.*$/hostname = ${HOSTS}/g" "Rewrite/vip_rewrite.conf"

#	cat "${TMP_FILE}"

	rm -f "${TMP_FILE}"
}

PATTERNS=$(strip_file_header "${SED_PATTERN_FILE}")
main
