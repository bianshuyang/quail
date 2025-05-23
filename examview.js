let $ = jQuery = require('jquery')
let Bootstrap = require('bootstrap')
const {ipcRenderer} = require('electron')
const url = require('url')

let localinfo
let blockKey
let numQuestions
let selectedQnum
let blockqlist
let qid
let numtags
let complete
let starttime
let elapsedtime
let showans
let timewarning = true
let ansvisible = false
let timerunning = true
let stillfalse = [-1,false]
let hltr
let tmpstorage

// bucket helper functions
function isInBucket(thisqid, bucket) {
  return localinfo.progress.tagbuckets[localinfo.tagnames.tagnames[0]][localinfo.index[thisqid][0]][bucket].includes(thisqid)
}
function addToBucket(thisqid, bucket) {
  for(var i=0; i<numtags; i++) {
    localinfo.progress.tagbuckets[localinfo.tagnames.tagnames[i]][localinfo.index[thisqid][i]][bucket].push(thisqid)
  }
}
function removeFromBucket(thisqid, bucket) {
  for(var i=0; i<numtags; i++) {
    var index = localinfo.progress.tagbuckets[localinfo.tagnames.tagnames[i]][localinfo.index[thisqid][i]][bucket].indexOf(thisqid);
    if (index > -1) {
      localinfo.progress.tagbuckets[localinfo.tagnames.tagnames[i]][localinfo.index[thisqid][i]][bucket].splice(index, 1);
   }
  }
}


//prev and next question buttons
$('#btn-prevques').on('click', function (e){
  if(selectedQnum >= 0) {
    newQnum = selectedQnum - 1
    $('.list-group-item')[newQnum].click()
    // rerender page based on user stats

    if ($('#btn-nextques-inline').text()!="Submit →" && localinfo.progress.blockhist[blockKey].submittedanswers[selectedQnum].length>0){
      rerender(selectedQnum);

    }
    else{
      limitedrerender(selectedQnum);
    }
    
  }
})

$('#btn-nextques').on('click', function (e){
  if(selectedQnum < numQuestions-1) {
    newQnum = selectedQnum + 1
    $('.list-group-item')[newQnum].click()
    if ($('#btn-nextques-inline').text()!="Submit →" && localinfo.progress.blockhist[blockKey].submittedanswers[selectedQnum].length>0){
      rerender(selectedQnum);

    }
    else{
      limitedrerender(selectedQnum);
    }
    
  } else {
    $('#btn-close').click()
  }
})
/////////////////// showing answer
/////////////////////////////////////})
/////////////////////////////////////})
/////////////////////////////////////
$('#btn-nextques-inline').on('click', function (e) {
  if(!complete && showans) {
    $('#rightcol').removeClass('d-none')
    $('#rightcol').addClass('d-flex')
    ansvisible = true
    //console.log("I made a click!");
    //console.log($('#btn-nextques-inline').text());
    submittingdatatodatabase();// submitting the answers to the database step 1
    createAnswerChoiceButtons(); // step2

  } else {
    submittingEXAMdatatodatabase();
    console.log(localinfo.progress.blockhist[0].answers);
    $('#btn-nextques').click();
  }
})
/////////////////////////////////////})
/////////////////////////////////////})
/////////////////////////////////////

async function rerender(selectedQnum){
  if (localinfo.progress.blockhist[blockKey].answers[selectedQnum] != null){
    step1();
    //console.log("OK?");
    await new Promise(resolve => setTimeout(resolve, 10)); // must wait!
    createAnswerChoiceButtons();
    //console.log("OK?");
  }
}


async function limitedrerender(selectedQnum){
  if (localinfo.progress.blockhist[blockKey].answers[selectedQnum] != null){
    //step1();
    //console.log("OK?");
    await new Promise(resolve => setTimeout(resolve, 10)); // must wait!
    createEXAMAnswerChoiceButtons();
    //console.log("OK?");
  }
}


function step1(){
  $('#rightcol').removeClass('d-none')
    $('#rightcol').addClass('d-flex')
    ansvisible = true
}

function submittingdatatodatabase(){
  console.log("BEGIN0");
  if(!complete && !ansvisible) {
      if( localinfo.progress.blockhist[blockKey].answers[selectedQnum]=='' ) {
        ipcRenderer.send('answerselect')

      }
      localinfo.progress.blockhist[blockKey].answers[selectedQnum] = tmpstorage;
      console.log("BEGIN");
      localinfo.progress.blockhist[blockKey].submittedanswers[selectedQnum] = tmpstorage;
      console.log(localinfo.progress.blockhist[blockKey].submittedanswers[selectedQnum]);
      console.log("END");
      $('.list-group-item').get(selectedQnum).style.fontWeight = 'normal'
    }

    if (ansvisible && stillfalse) {
      //$(this).addClass('active')
      if( localinfo.progress.blockhist[blockKey].answers[selectedQnum]=='' ) {
        ipcRenderer.send('answerselect')
      }
      localinfo.progress.blockhist[blockKey].answers[selectedQnum] += tmpstorage
      if (localinfo.progress.blockhist[blockKey].submittedanswers[selectedQnum]==''){
        localinfo.progress.blockhist[blockKey].submittedanswers[selectedQnum] = tmpstorage;
      }
      $('.list-group-item').get(selectedQnum).style.fontWeight = 'normal'
    }

}


function submittingEXAMdatatodatabase(){
  if(!ansvisible) {
      if( localinfo.progress.blockhist[blockKey].answers[selectedQnum]=='' ) {
        ipcRenderer.send('answerselect')
      }
      localinfo.progress.blockhist[blockKey].answers[selectedQnum] = tmpstorage;
      localinfo.progress.blockhist[blockKey].submittedanswers[selectedQnum] = tmpstorage;
      $('.list-group-item').get(selectedQnum).style.fontWeight = 'normal'
    }

}




// handle pause and close buttons
$('#btn-pause').on('click', function (e) {
  localinfo.progress.blockhist[blockKey].elapsedtime = elapsedtime
  localinfo.progress.blockhist[blockKey].currentquesnum = selectedQnum
  ipcRenderer.send('pauseblock', localinfo.progress)
})
$('#btn-close').on('click', function (e) {
  if(!complete) {
    if(confirm(`${timewarning ? '' : 'Time is up!\n'}End block and mark as completed?`)) {
      localinfo.progress.blockhist[blockKey].elapsedtime = elapsedtime
      localinfo.progress.blockhist[blockKey].complete = true
      numcorrect = 0
      for (var i=0; i<numQuestions; i++) {
        if( localinfo.progress.blockhist[blockKey].answers[i][0] == localinfo.choices[blockqlist[i]].correct ) {
          numcorrect = numcorrect + 1
          if( isInBucket(blockqlist[i], 'incorrects') ) {
            removeFromBucket(blockqlist[i], 'incorrects')
          }
        } else {
          if( !isInBucket(blockqlist[i], 'incorrects') ) {
            addToBucket(blockqlist[i], 'incorrects')
          }
        }
      }
      localinfo.progress.blockhist[blockKey].numcorrect = numcorrect
      localinfo.progress.blockhist[blockKey].currentquesnum = 0
      ipcRenderer.send('pauseblock', localinfo.progress)
    }
  } else {
    localinfo.progress.blockhist[blockKey].currentquesnum = selectedQnum
    ipcRenderer.send('pauseblock', localinfo.progress)
  }
})


//flag button
$('#btn-flagged').on('click', function (e){
  if( isInBucket(qid, 'flagged') ) {
    $(this).removeClass('active')
    $(`#flag-${selectedQnum}`).remove()
    removeFromBucket(qid, 'flagged')
  } else {
    $(this).addClass('active')
    flaghtml = `<span id="flag-${selectedQnum}" class="badge badge-warning flag" data-qnum="${selectedQnum}">⚑</span>`
    $('.list-group-item').eq(selectedQnum).find('span').eq(0).after(flaghtml)
    addToBucket(qid, 'flagged')
  }
})

// generate question list group item html
function generateQuestionList() {
  for(let i=0; i<numQuestions; i++) {
    fontweight = 'normal'
    if(localinfo.progress.blockhist[blockKey].answers[i] == '') {
      fontweight = '800'
    }
    flaghtml = ''
    if(isInBucket(blockqlist[i], 'flagged')) {
      flaghtml = `<span id="flag-${i}" class="badge badge-warning flag" data-qnum="${i}">⚑</span>`
    }
    rightwronghtml = ''
    if(complete) {
      if( localinfo.progress.blockhist[blockKey].submittedanswers[i] == localinfo.choices[blockqlist[i]].correct ) {
        //correct answer
        console.log("You have,",localinfo.progress.blockhist[blockKey].answers[i][-1],'but',localinfo.choices[blockqlist[i]].correct )
        rightwronghtml = '<span class="badge badge-success">✓</span>'
      } else {
        //wrong answer
        console.log("You have,",localinfo.progress.blockhist[blockKey].answers[i][-1],'but',localinfo.choices[blockqlist[i]].correct )
        
        rightwronghtml = '<span class="badge badge-danger">✗</span>'
      }
    }
    html = `<li class="list-group-item d-md-flex justify-content-between align-items-md-center" style="padding: 2px 10px;font-weight: ${fontweight};" data-qnum="${i}"><span>${i+1}&nbsp;</span>${flaghtml}${rightwronghtml}</li>`
    $('#listgroup-questions').append(html)
  }
  $('.list-group-item').on('click', function (e) {
    $('.list-group-item').removeClass('active')
    $(this).addClass('active')
    selectedQnum = parseInt($(this).data('qnum'))
    loadQuestion()
    if ($('#btn-nextques-inline').text()!="Submit →" && localinfo.progress.blockhist[blockKey].submittedanswers[selectedQnum].length>0){
      rerender(selectedQnum);

    }
    else{
      limitedrerender(selectedQnum);
    }

  })
}




// generate answer choice html
function createEXAMAnswerChoiceButtons() {
  $('#btngrp-choices').empty()

  for (const c of localinfo.choices[qid].options) {
    //console.log(c);
    //console.log(localinfo);
    //console.log(qid);
    //console.log(localinfo.choices[qid].options);
    buttonCssClasses = ''
    yourchoice = localinfo.progress.blockhist[blockKey].submittedanswers[selectedQnum]
    //console.log(yourchoice,correctchoice,c);

    if (c==yourchoice){
      buttonCssClasses = 'btn-outline-primary active'
    }
    else{
      buttonCssClasses = 'btn-outline-primary'
    }

    /*if(complete || ansvisible) {
      if( c == var2 ) {
        if (c == var1 ) {
          buttonCssClasses = 'btn-success'
        }
        else {
          buttonCssClasses = 'btn-success disabled'
        }
      } else {
        if (c == var1) {
          buttonCssClasses = 'btn-danger'
        }
        else {
          buttonCssClasses = 'btn-outline-primary disabled'
        }
      }
    } else {
      if (c == var1) {
        buttonCssClasses = 'btn-outline-primary active'
      }
      else {
        buttonCssClasses = 'btn-outline-primary'
      }
    }*/
    


    html = `<button class="btn ${buttonCssClasses} border rounded-pill btn-choice" type="button" style="margin: 4px;">${c}</button>`
    $('#btngrp-choices').append(html)

  }


  $('.btn-choice').on('click', function (e){
    //$(this).addClass("btn-outline-primary active")
    tmpstorage = $(this).text();
    console.log(tmpstorage);
    

  })




}



// generate answer choice html
function createAnswerChoiceButtons() {
  $('#btngrp-choices').empty()

  for (const c of localinfo.choices[qid].options) {
    //console.log(c);
    //console.log(localinfo);
    //console.log(qid);
    //console.log(localinfo.choices[qid].options);
    buttonCssClasses = ''
    allurchoice = localinfo.progress.blockhist[blockKey].answers[selectedQnum];
    if (allurchoice.length>=1){
      yourchoice = allurchoice.charAt(allurchoice.length-1);
    }
    else{
      yourchoice = allurchoice;
    }
    correctchoice = localinfo.choices[blockqlist[selectedQnum]].correct
    //console.log(yourchoice,correctchoice,c);

    if (complete || ansvisible){
        if (c!=yourchoice){
          if (allurchoice.match(c) == null){
            buttonCssClasses = 'btn-outline-primary'
            $("."+c).hide();
          }
          else{
            $("."+c).show();
            if (c!=correctchoice){
                buttonCssClasses = 'btn-danger'
            }
            else{
                buttonCssClasses ='btn-success' 
            }
          }
        }
        else{
          $("."+yourchoice).show();
          if (yourchoice!=correctchoice){
              buttonCssClasses = 'btn-danger'
              
          }
          else{
              buttonCssClasses ='btn-success'
              if (stillfalse[0]!=selectedQnum){
                stillfalse = true
              }
              else{
                stillfalse = false
              }
          }
        }
    }

    /*if(complete || ansvisible) {
      if( c == var2 ) {
        if (c == var1 ) {
          buttonCssClasses = 'btn-success'
        }
        else {
          buttonCssClasses = 'btn-success disabled'
        }
      } else {
        if (c == var1) {
          buttonCssClasses = 'btn-danger'
        }
        else {
          buttonCssClasses = 'btn-outline-primary disabled'
        }
      }
    } else {
      if (c == var1) {
        buttonCssClasses = 'btn-outline-primary active'
      }
      else {
        buttonCssClasses = 'btn-outline-primary'
      }
    }*/
    


    html = `<button class="btn ${buttonCssClasses} border rounded-pill btn-choice" type="button" style="margin: 4px;">${c}</button>`
    $('#btngrp-choices').append(html)

  }


  $('.btn-choice').on('click', function (e){
    //$(this).addClass("btn-outline-primary active")
    tmpstorage = $(this).text();
    console.log(tmpstorage);
    

  })




}

// load question
function loadQuestion() {
  // Attempt to revert translation to English before loading new question content.
  // This aims to clear the Google Translate widget's state related to the old content.
  var googleTranslatePlaceholder = document.getElementById('google_translate_element_placeholder'); //
  if (googleTranslatePlaceholder) {
    var selectElement = googleTranslatePlaceholder.querySelector('.goog-te-combo'); //
    // Check if a translation is active (not 'en') and the trigger function exists
    if (selectElement && selectElement.value !== 'en' && typeof triggerGoogleTranslate === 'function') {
      triggerGoogleTranslate('en'); // Programmatically switch back to English
      // Note: This operation is asynchronous. The page might briefly flash English.
    }
  }
  if(!complete && showans) {
    
    $('#rightcol').addClass('d-none')
    $('#rightcol').removeClass('d-flex')

    ansvisible = false
  }
  qid = blockqlist[selectedQnum]
  $('#leftreplace').load(url.pathToFileURL(localinfo.path).toString() + '/' + qid + '-q.html', function() {
    $('#rightreplace').load(url.pathToFileURL(localinfo.path).toString() + '/' + qid + '-s.html', function() {
      updateContent()
    })
  })
  createAnswerChoiceButtons()
  if(selectedQnum==0) {
    $('#btn-prevques').addClass('disabled')
  } else {
    $('#btn-prevques').removeClass('disabled')
  }
  if( isInBucket(qid, 'flagged') ) {
    $('#btn-flagged').addClass('active')
  } else {
    $('#btn-flagged').removeClass('active')
  }
  if(!complete && showans) {
    $('#btn-nextques-inline').text('Check Answer')
  }
}
function updateContent() {
  apppath = window.document.URL.match(/(.+)\/examview.html/)[1]
  qbpath = url.pathToFileURL(localinfo.path).toString()
  for (const e of $('img')) {
    e.src = e.src.replace(apppath, qbpath)
    e.style.maxWidth = '100%'
  }
  for (const c of $('#leftreplace').find($('img'))) {
    c.style.maxHeight = (window.innerHeight * 1/2).toString() + 'px'
    $(c).on('click', function (e) {
        window.open(c.src)
    })
  }
  for (const c of $('#rightreplace').find($('img'))) {
    c.style.maxHeight = (window.innerHeight * 3/4).toString() + 'px'
    $(c).on('click', function (e) {
        window.open(c.src)
    })
  }
  for (const e of $('audio')) {
    if(e.src=='') {
      orig = $(e).find($('source')).get(0).src
      e.src = orig.replace(apppath, qbpath)
    } else {
      assetpath = e.src.replace(window.document.URL.match(/(.+)\/examview.html/)[1], '')
      e.src = e.src.replace(apppath, qbpath)
    }
  }
  for (const e of $('video')) {
    e.src = e.src.replace(apppath, qbpath)
  }
  for (const e of $('a')) {
    if(e.href!='') {
      e.href = e.href.replace(apppath, qbpath)
    }
  }
  $('#leftcontent').get(0).scrollTop = 0
  $('#rightcontent').get(0).scrollTop = 0

  //highlighting
  function enableClickRemove(hlts) {
    for(const thishlt of hlts) {
      $(thishlt).on('click', function(e) {
        timestamp = $(e.target).data('timestamp')
        for(const otherhlt of hltr.getHighlights()) {
          if( $(otherhlt).data('timestamp')==timestamp ) {
            hltr.removeHighlights(otherhlt)
          }
        }
        localinfo.progress.blockhist[blockKey].highlights[selectedQnum] = hltr.serializeHighlights()
      })
    }
  }
  hltr = new TextHighlighter($('#leftreplace').get(0), {
    onAfterHighlight: function(range, hlts) {
      enableClickRemove(hlts)
      localinfo.progress.blockhist[blockKey].highlights[selectedQnum] = hltr.serializeHighlights()
    }
  })
  hltr.deserializeHighlights(localinfo.progress.blockhist[blockKey].highlights[selectedQnum])
  enableClickRemove(hltr.getHighlights())

}

//populate Panes
function populatePanes() {
  panenum = 0
  for (const panetext in localinfo.panes) {
    panebtnhtml = `<button class="btn btn-info openpane" type="button" style="font-size: 10px;height: 44px;word-break: keep-all;width: min-content;" data-key="${panetext}">${panetext}</button>`
    $('#btngrp-panes').append(panebtnhtml)
  }
  $('.openpane').on('click', function (e) {
    paneurl = localinfo.path + '/' + localinfo.panes[$(this).data('key')].file
    prefs = localinfo.panes[$(this).data('key')].prefs
    title = $(this).data('key')
    window.open(paneurl, title, prefs)
  })
}

// handle actions dependent on qbankinfo
ipcRenderer.on('qbankinfo', function (event, qbankinfo) {

  localinfo = qbankinfo

  //initialize variables
  numtags = Object.keys(localinfo.tagnames.tagnames).length
  blockKey = localinfo.blockToOpen
  blockqlist = localinfo.progress.blockhist[blockKey].blockqlist
  numQuestions = blockqlist.length
  complete = localinfo.progress.blockhist[blockKey].complete
  timelimit = localinfo.progress.blockhist[blockKey].timelimit
  oldelapsedtime = localinfo.progress.blockhist[blockKey].elapsedtime
  console.log(localinfo.progress.blockhist[blockKey]);
  console.log(blockKey);
  selectedQnum = localinfo.progress.blockhist[blockKey].currentquesnum
  showans = localinfo.progress.blockhist[blockKey].showans

  //layout changes for complete vs in progress
  if(!complete) {
    $('#rightcol').addClass('d-none')
    $('#rightcol').removeClass('d-flex')
  } else {
    $('#btn-pause').remove()
  }

  // handle resizing
  function handleResize() {
    $('#column-questions').get(0).style.height = (window.innerHeight-24).toString()+'px'
    $('#leftcontent').get(0).style.height = (window.innerHeight-128).toString()+'px'
    $('#rightcontent').get(0).style.height = (window.innerHeight-128).toString()+'px'
    if(!complete) {
      padpercentage = (window.innerWidth-800)/40
      if(padpercentage<0) {
        padpercentage=0
      }
      $('#leftcontent').get(0).style.paddingLeft=`${padpercentage}%`
      $('#leftcontent').get(0).style.paddingRight=`${padpercentage}%`
    }
  }
  window.addEventListener('resize', function(event) {
    handleResize()
  });
  handleResize()

  generateQuestionList()

  $('.list-group-item')[selectedQnum].click()

  if(!complete) {
    starttime = Date.now()
    function updateTime() {
      if (timerunning && ansvisible) {
        timerunning = false
        oldelapsedtime = elapsedtime
      }
      if(!timerunning && !ansvisible) {
        starttime = Date.now()
        timerunning = true
      }
      if (timerunning) {
        
        elapsedtime = oldelapsedtime + (Date.now() - starttime) / 1000
        if(timelimit == -1) {
          $('#timep').text(`Time Used\n${Math.floor( elapsedtime / 3600 )}:${Math.floor( (elapsedtime%3600)/60 ).toString().padStart(2,0)}:${Math.floor( elapsedtime%60 ).toString().padStart(2,0)}`)
        } else {
          remainingtime = timelimit - elapsedtime
          if(timewarning && remainingtime<0) {
            timewarning = false
            $('#timep').get(0).style.color = "red"
            $('#btn-close').click()
          }
          if(remainingtime>0) {
            $('#timep').text(`Time Remaining\n${Math.floor( remainingtime / 3600 )}:${Math.floor( (remainingtime%3600)/60 ).toString().padStart(2,0)}:${Math.floor( remainingtime%60 ).toString().padStart(2,0)}`)
          } else {
            absremainingtime = Math.abs(remainingtime)
            $('#timep').text(`Time Remaining\n-${Math.floor( absremainingtime / 3600 )}:${Math.floor( (absremainingtime%3600)/60 ).toString().padStart(2,0)}:${Math.floor( absremainingtime%60 ).toString().padStart(2,0)}`)
          }
        }
      }
    }
    setInterval(updateTime, 500)
  } else {
    $('#timep').text(`Time Used on Block\n${Math.floor( oldelapsedtime / 3600 )}:${Math.floor( (oldelapsedtime%3600)/60 ).toString().padStart(2,0)}:${Math.floor( oldelapsedtime%60 ).toString().padStart(2,0)}`)
  }

  populatePanes()

})

function customScrollbars() {

  var styleElement = document.createElement("style")
  styleElement.appendChild(document.createTextNode("div ::-webkit-scrollbar {width: 5px; height: 8px; background-color: #fff;}"))
  document.getElementsByTagName("head")[0].appendChild(styleElement)
  var styleElement = document.createElement("style");
  styleElement.appendChild(document.createTextNode("div ::-webkit-scrollbar-thumb {background: #777;}"));
  document.getElementsByTagName("head")[0].appendChild(styleElement);

}

ipcRenderer.on('dopause', function (event) {
  if(!complete) {
    $('#btn-pause').click()
  } else {
    $('#btn-close').click()
  }
})
