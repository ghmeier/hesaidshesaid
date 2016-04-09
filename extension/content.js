
/*
document is tree of all html text on page
we're putting all document content into body
*/
var body = document.all[0];//.textContent;
var innerHTML = document.all[0].innerHTML;
var url = document.URL;

//console.log(innerHTML);
$.ajax({
	url: "https://hesaidshesaid.herokuapp.com/guess",

	method: 'POST',
	dataType: 'json',
	data:{text: url},
	success: function(data){
		console.log(data);
	}
});