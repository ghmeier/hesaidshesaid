document.addEventListener('DOMContentLoaded', function() {

var genderMap = {"male":"Male","female":"Female","nonBin":"Non-Binary"};

chrome.tabs.query({active:true,currentWindow:true},function(tabs){
    chrome.tabs.sendMessage(tabs[0].id,{status:"opened"},function(response){
        var data = response.data;
        console.log(data);
        document.getElementById("pag").innerHTML = genderMap[data.author];
        document.getElementById("psg").innerHTML = genderMap[data.subject.split("_")[1]];
        document.getElementById("psc").innerHTML = data.sentiment;
        document.getElementById("pss1").innerHTML = genderMap[data.sentimentGender.split("_")[0]];
        document.getElementById("pss2").innerHTML = genderMap[data.sentimentGender.split("_")[1]];
    });
});

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