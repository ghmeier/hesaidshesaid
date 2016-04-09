
/*
document is tree of all html text on page
we're putting all document content into body
*/


//console.log(innerHTML);

	chrome.extension.onMessage.addListener(
		function(request,sender,sendMessage){
			if(request.status == 'opened'){
			
			var body = document.all[0];//.textContent;
			var innerHTML = document.all[0].innerHTML;
			var url = document.URL;
				
				
			$.ajax({
				url: "https://hesaidshesaid.herokuapp.com/guess",
				method: 'POST',
				dataType: 'json',
				data:{text: url},
				success: function(data){
		
				var guessData = JSON.stringify(data);
				sendMessage({text: guessData})
				}
			})
			
			}
		}
	);
