document.addEventListener('DOMContentLoaded', function() {
<<<<<<< HEAD
  
	chrome.extension.sendMessage({status: "opened"},
		function(response){
			console.log(response);
		}
	);
  
  
  var Button = document.getElementById('Submit');
=======
  var Button = document.getElementById('Submit');

>>>>>>> 99e7837d7e56b1ddefc0b48f891c2bd33436ccb0
  Button.addEventListener('click', function() {

	var genderAuth;
	var genderA = document.getElementsByClassName('genderA');
	for(var i = 0; i < genderA.length; i++){
	  if(genderA[i].checked){
		  genderAuth = genderA[i].value;
	  }
	}
	var genderSub;
	var genderS = document.getElementsByClassName('genderS');
	for(var i = 0; i < genderS.length; i++){
	  if(genderS[i].checked){
		  genderSub = genderS[i].value;
	  }
	}

    chrome.tabs.getSelected(null, function(tab) {
      d = document;
      var f = d.createElement('form');

	  var gA = d.createElement('input');
	  gA.name = 'author';
	  gA.type = 'hidden';
	  gA.value = genderAuth;

	  var gS = d.createElement('input');
	  gS.name = 'subject';
	  gS.type = 'hidden';
	  gS.value = genderSub;

	  var i = d.createElement('input');
      i.name = 'text';
	  i.type = 'hidden';
      i.value = tab.url;


	  f.appendChild(gA);
	  f.appendChild(gS);
      f.appendChild(i);
      d.body.appendChild(f);

	  f.action = 'https://hesaidshesaid.herokuapp.com/learn';
      f.method = 'post';
      f.submit();
    });
  }, false);
  
  
}, false);