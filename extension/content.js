
/*
document is tree of all html text on page
we're putting all document content into body
*/

var url = document.URL;
$.ajax({
	url: "http://hesaidshesaid.herokuapp.com/guess",
	method: 'POST',
	dataType: 'json',
	data:{text: url},
	success: function(data){
		chrome.runtime.onMessage.addListener(function(request,sender,sendMessage){
			if(request.status == 'opened'){
				sendMessage({data:data});
			}
		});
	}
});
