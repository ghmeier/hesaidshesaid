document.addEventListener('DOMContentLoaded', function() {
  var Button = document.getElementById('Submit');

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