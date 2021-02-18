let html = $response.body;
let nonce = html.match(/nonce="[\w\-]*"/g);

html = html.replace('apple-itunes-app', '');

html =
	html.replace(/(<\/html>)/g, '') +
	`
<style ${nonce}>
.OpenInAppButton.is-shown {
    -webkit-transform:translate(-50%,50px) !important;
    transform: translate(-50%,50px) !important;
}
.CommentsForOia button {
  display: none;
}
</style>

<script ${nonce}>
setTimeout(
() => {
	const clazz = ['.ModalWrap', '.MobileModal-wrapper', '.Modal-wrapper']
	clazz.forEach(v => {
		const ele = document.querySelector(v)
		if ( ele ) {
			ele.remove()
		}
	})
}
,
1300
)

setTimeout(
() => {
	document.querySelector("body").className = document.querySelector("body").className.replace('ModalWrap-body', '')
    document.querySelector("body").style.overflow = "auto"
    document.querySelector("body").style.position = ""
    document.querySelector(".Question-main").removeAttribute("class")
    // document.querySelectorAll(".ContentItem-expandButton").forEach(item => item.click())
}
,
1300
)
</script>
</html>
`;

$done({ body: html });
