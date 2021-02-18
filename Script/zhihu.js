let html = $response.body;
let head = $response.head;
let nonce = html.match(/nonce="[\w\-]*"/g)[1];
nonce = nonce || head.match(/nonce="[\w\-]*"/g);

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
    document.querySelector(".MobileModal-wrapper").remove()
    document.querySelector(".Modal-wrapper").remove()
}
,
300
)

setTimeout(
() => {
    document.querySelector("body").style.overflow = "auto"
    document.querySelector(".Question-main").removeAttribute("class")

    // document.querySelectorAll(".ContentItem-expandButton").forEach(item => item.click())
}
,
600
)
</script>
</html>
`;

$done({ body: html });
