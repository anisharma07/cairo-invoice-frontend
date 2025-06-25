//////////////////////////////
//
//  App General -- These form the general UI and other stuff
//  common to all templated apps
//
//////////////////////////////
htmlEncryptionKey = "EncryptionKeyisLooooooooooooooooooongEnough";
applicationName = "Account Balance";
function showEmailComposer() {
  var control = SocialCalc.GetCurrentWorkBookControl();
  var content = control.workbook.spreadsheet.CreateSheetHTML();
  window.plugins.emailComposer.showEmailComposer(
    "Home Budget",
    content,
    "",
    "",
    "",
    true
  );
}
function showPrintDialog() {
  var control = SocialCalc.GetCurrentWorkBookControl();
  var html = control.workbook.spreadsheet.CreateSheetHTML();
  window.plugins.printPlugin.print(
    html,
    function (result) {
      //alert("Printing successful");
    },
    function (result) {
      if (!result.available) {
        alert("Printing is not available");
      } else {
        //Localised error description
        //alert(result.error);
      }
    },
    { dialogOffset: { left: 95, top: 60 } }
  );
}

function showBuyLink() {
  window.open(
    "http://itunes.apple.com/us/app/angry-birds-rio/id420635506?mt=8&uo=4"
  );
}
function showHelp() {
  var strPath = String(window.location);
  var path = strPath.substr(0, strPath.lastIndexOf("/"));
  PhoneGap.exec(
    "ChildBrowserCommand.showWebPage",
    encodeURI(path + "/help.html")
  );
}

SocialCalc.oldBtnActive = 1;

function getSheetIds() {
  var control = SocialCalc.GetCurrentWorkBookControl();
  var sheets = [];
  for (key in control.sheetButtonArr) {
    //console.log(key);
    sheets.push(key);
  }
  return sheets;
}

function activateFooterBtn(index) {
  if (index == SocialCalc.oldBtnActive) return;

  var oldbtn = "footerbtn" + SocialCalc.oldBtnActive;
  var newbtn = "footerbtn" + index;

  $("#" + newbtn).addClass("ui-btn-active");
  $("#" + oldbtn).removeClass("ui-btn-active");

  var sheets = getSheetIds();
  // disable active edit boxes
  var control = SocialCalc.GetCurrentWorkBookControl();
  var spreadsheet = control.workbook.spreadsheet;
  var ele = document.getElementById(spreadsheet.formulabarDiv.id);
  if (ele) {
    SocialCalc.ToggleInputLineButtons(false);
    var input = ele.firstChild;
    input.style.display = "none";
    spreadsheet.editor.state = "start";
  }
  SocialCalc.WorkBookControlActivateSheet(sheets[index - 1]);

  SocialCalc.oldBtnActive = index;

  $("#indexPageSheetName").html($("#" + newbtn).attr("name"));
}

function tweakUpdateList() {
  console.log("in list page");
  var ele1 = document.getElementById("filelist1");
  var str = document.getElementById("filelist").innerHTML;

  var passwordObject = window.localStorage.getItem(htmlEncryptionKey);
  if (passwordObject) passwordObject = JSON.parse(passwordObject);
  protectedImg =
    '<span style="vertical-align:middle;position: absolute;top:1.2em;"><img src="lib/jquery/images/protected.png" /></span>';

  // for each file in the store, replace the template with the filename

  // for each file in the store, replace the template with the filename
  var hstr = "";
  var i = 0;
  console.log(window.localStorage.length);
  for (i = 0; i < window.localStorage.length; i++) {
    var temp = str;
    if (window.localStorage.key(i).length >= 30) continue;
    filename = window.localStorage.key(i);
    temp = temp.replace("!--Template1--", filename);
    temp = temp.replace("!--Template2--", filename);
    temp = temp.replace("!--Template3--", filename);
    if (passwordObject && passwordObject[filename])
      temp = temp.replace("<!--ProtectedImagePlace-->", protectedImg);
    hstr = hstr + temp;
  }

  // add the default file name
  var temp = str;
  temp = temp.replace("!--Template1--", "default");
  temp = temp.replace("!--Template2--", "default");
  temp = temp.replace("!--Template3--", "default");
  hstr = hstr + temp;

  console.log(hstr);
  ele1.innerHTML = hstr;
  console.log("edited list page");
}

/*
$('#listPage').live('pagebeforeshow', function(event) {
tweakUpdateList();
});
*/

function saveFileSubmit() {
  console.log("file is:");
  var fname = document.getElementById("saveasname").value;
  var val = SocialCalc.WorkBookControlSaveSheet();
  console.log(val.length);
  var val1 = encodeURIComponent(val);
  console.log(val1.length);
  window.localStorage.setItem(fname, val1);
  alert("Saved as: " + fname);
}

function changePage(pageid) {
  $.mobile.changePage($(pageid), { transition: "slideup" });
}

function updateFileName(fname) {
  selectedFile = fname;
  Aspiring.AutoSave.selectedFile = fname;

  //document.getElementById("indexPage-fname").innerHTML="Editing: "+fname;
  //document.getElementById("listPage-fname").innerHTML="Editing: "+fname;
  //document.getElementById("filePage-fname").innerHTML="Editing: "+fname;
}

function viewFile(filename) {
  //alert("viewFile: "+selectedFile)
  console.log("view file " + filename);
  //$.mobile.showPageLoadingMsg()
  selectedFile = filename;
  var data = "";

  /*Changes for Encryption Implementation Start*/

  if (filename != "default") {
    var decrypt = decryptFileOpen(filename); //change
    if (decrypt == true) {
      //change
      data = window.localStorage.getItem(filename);
      console.log(data.length);
      SocialCalc.WorkBookControlInsertWorkbook(decodeURIComponent(data));
    } else {
      return;
    } //change
    /*Changes for Encryption Implementation End*/
  } else {
    data = document.getElementById("sheetdata").value;
    SocialCalc.WorkBookControlInsertWorkbook(data);
  }
  updateFileName(filename);

  // reset the editor state

  SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.editor.state =
    "start";

  SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.ExecuteCommand(
    "redisplay",
    ""
  );
  //$.mobile.hidePageLoadingMsg()
  //$.mobile.changePage(($("#indexPage")), { transition: "slideup"} );
  //window.setTimeout(
  //function() {
  //$.mobile.hidePageLoadingMsg()
  $.mobile.changePage($("#indexPage"), { transition: "slideup" });
  //},1000
  //)
}

function deleteFilePrompt(filename) {
  if (filename == "default") {
    window.plugins.Prompt.show(
      "Cannot Delete File" + filename,
      saveAsCancel,
      saveAsCancel,
      "nope", // ok button title - not used
      "OK", // cancel button title
      "no"
    );

    return;
  }
  /*Changes for Encryption Implementation Start*/
  var okfn = function () {
    var decrypt = decryptFileDelete(filename); //change
    if (decrypt == true) {
      //change
      deleteFile(filename);
    }
  };
  /*Changes for Encryption Implementation End*/

  window.plugins.Prompt.show(
    "Delete file: " + filename + " ?",
    okfn,
    saveAsCancel,
    "Submit", // ok button title
    "Cancel", // cancel button title
    "no"
  );
}

function deleteFile(filename) {
  window.localStorage.removeItem(filename);
  //alert("Deleted file: "+filename)
  tweakUpdateList();
  // refresh the page
  //$("#listPage").refresh();

  if (selectedFile == filename) {
    // set the selected file back to default
    updateFileName("default");
    // load the default file into socialcalc
  }
}

function saveAsOk(fname) {
  // do some validation checks on file name
  if (fname == "default") {
    window.plugins.Prompt.show(
      "Cannot update default file \n\n Use another file name",
      saveAsCancel,
      saveAsCancel,
      "nope", // ok button title - not used
      "OK", // cancel button title
      "no"
    );
    return;
  }

  if (fname == "") {
    window.plugins.Prompt.show(
      "Empty filename, Please use another file name",
      saveAsCancel,
      saveAsCancel,
      "nope", // ok button title - not used
      "OK", // cancel button title
      "no"
    );
    return;
  }

  if (fname.length > 30) {
    window.plugins.Prompt.show(
      "Filename too long  \n\n Please enter a file name less than 30 characters",
      saveAsCancel,
      saveAsCancel,
      "nope", // ok button title - not used
      "OK", // cancel button title
      "no"
    );
    return;
  }

  var val = SocialCalc.WorkBookControlSaveSheet();
  console.log(val.length);
  var val1 = encodeURIComponent(val);
  console.log(val1.length);
  window.localStorage.setItem(fname, val1);
  console.log("saved as " + fname);

  // set the top right file to selected file
  updateFileName(fname);
}

function saveAsCancel() {
  console.log("saveas canceled");
}

function saveAsPrompt() {
  //alert("in prompt");
  window.plugins.Prompt.show(
    "Enter File Name",
    saveAsOk,
    saveAsCancel,
    "Submit", // ok button title (optional)
    "Cancel", // cancel button title (optional)
    "yes"
  );
}

function saveCurrentFile() {
  if (selectedFile == "default") {
    window.plugins.Prompt.show(
      "Cannot update default file! \n\n Use SaveAs",
      saveAsCancel,
      saveAsCancel,
      "nope", // ok button title - not used
      "OK", // cancel button title
      "no"
    );
    return;
  }

  console.log("saving current file " + selectedFile);
  var val = SocialCalc.WorkBookControlSaveSheet();
  console.log(val.length);
  var val1 = encodeURIComponent(val);
  console.log(val1.length);
  window.localStorage.setItem(selectedFile, val1);
  console.log("saved as " + selectedFile);

  window.plugins.Prompt.show(
    "Saved file : " + selectedFile,
    saveAsCancel,
    saveAsCancel,
    "nope", // ok button title - not used
    "OK", // cancel button title
    "no"
  );
}

function logoAddOk(link) {
  console.log(link);

  var i = 1;

  var cmd =
    'set F4 text t <img src="' +
    link +
    '" height="100px" align="middle"></img>' +
    "\n";
  console.log(cmd);
  var control = SocialCalc.GetCurrentWorkBookControl();

  var currsheet = control.currentSheetButton.id;

  if (
    currsheet == "sheet1" ||
    currsheet == "sheet2" ||
    currsheet == "sheet3" ||
    currsheet == "sheet4"
  ) {
    cmd = { cmdtype: "scmd", id: currsheet, cmdstr: cmd, saveundo: false };
    control.ExecuteWorkBookControlCommand(cmd, false);
  }
}

function logoRemoveOk() {
  console.log("remove logo");
  var cmd = "erase F4 formulas";

  var control = SocialCalc.GetCurrentWorkBookControl();
  var currsheet = control.currentSheetButton.id;

  if (
    currsheet == "sheet1" ||
    currsheet == "sheet2" ||
    currsheet == "sheet3" ||
    currsheet == "sheet4"
  ) {
    cmd = { cmdtype: "scmd", id: currsheet, cmdstr: cmd, saveundo: false };
    control.ExecuteWorkBookControlCommand(cmd, false);
  }
}

function showAddLogo() {
  window.plugins.Prompt.show(
    "Enter Image Url",
    logoAddOk,
    saveAsCancel,
    "Submit", // ok button title (optional)
    "Cancel", // cancel button title (optional)
    "yes"
  );
}

function showClearLogo() {
  window.plugins.Prompt.show(
    "Remove Logo ?",
    logoRemoveOk,
    saveAsCancel,
    "Submit", // ok button title
    "Cancel", // cancel button title
    "no"
  );
}

function encryptFile() {
  var passwordObject = window.localStorage.getItem(htmlEncryptionKey);
  if (passwordObject) passwordObject = JSON.parse(passwordObject);
  else passwordObject = {};
  var promptFile = function (filename) {
    if (filename == "") {
      navigator.notification.alert(
        "Filename cannot be empty",
        null,
        applicationName
      );
      return;
    } else if (filename.length >= 30) {
      navigator.notification.alert(
        "Filename cannot be more than 30 characters",
        null,
        applicationName
      );
      return;
    }
    if (window.localStorage.getItem(filename)) {
      navigator.notification.alert(
        "File with the same name already exists",
        null,
        applicationName
      );
      return;
    }
    var promptPass = function passString(passString) {
      if (passString == "") {
        navigator.notification.alert(
          "Password cannot be empty",
          null,
          applicationName
        );
        return;
      } else if (passString.length >= 30) {
        navigator.notification.alert(
          "Password cannot be more than 30 characters",
          null,
          applicationName
        );
        return;
      }

      passwordObject[filename] = passString;
      var val = SocialCalc.WorkBookControlSaveSheet();
      console.log(val.length);
      var val1 = encodeURIComponent(val);
      console.log(val1.length);
      window.localStorage.setItem(filename, val1);
      passwordObject = JSON.stringify(passwordObject);
      window.localStorage.setItem(htmlEncryptionKey, passwordObject);
    };
    window.plugins.Prompt.show(
      "Enter Password",
      promptPass,
      null,
      "Submit", // ok button title (optional)
      "Cancel", // cancel button title (optional)
      "yes"
    );
  };

  window.plugins.Prompt.show(
    "Enter File Name",
    promptFile,
    null,
    "Submit", // ok button title (optional)
    "Cancel", // cancel button title (optional)
    "yes"
  );
}

function decryptFileOpen(filename) {
  var passwordObject = window.localStorage.getItem(htmlEncryptionKey);
  console.log(passwordObject);
  passwordObject = JSON.parse(passwordObject);

  if (!passwordObject) {
    return true;
  }
  if (!passwordObject[filename]) {
    return true;
  }

  var promptPass = function (passString) {
    if (passString == passwordObject[filename]) {
      data = window.localStorage.getItem(filename);
      console.log(data.length);
      SocialCalc.WorkBookControlInsertWorkbook(decodeURIComponent(data));
      SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.editor.state =
        "start";
      SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.ExecuteCommand(
        "redisplay",
        ""
      );
      $.mobile.changePage($("#indexPage"), { transition: "slideup" });
    } else {
      navigator.notification.alert(
        "You have entered wrong Password",
        null,
        applicationName
      );
    }
  };

  window.plugins.Prompt.show(
    "Enter password for this File",
    promptPass,
    null,
    "Submit", // ok button title (optional)
    "Cancel", // cancel button title (optional)
    "yes"
  );
  return false;
}

function decryptFileDelete(filename) {
  var passwordObject = window.localStorage.getItem(htmlEncryptionKey);
  console.log(passwordObject);
  passwordObject = JSON.parse(passwordObject);

  if (!passwordObject) {
    return true;
  }
  if (!passwordObject[filename]) {
    return true;
  }

  var promptPass = function (passString) {
    if (passString == passwordObject[filename]) {
      deleteFile(filename);
      delete passwordObject[filename];
      passwordObject = JSON.stringify(passwordObject);
      window.localStorage.setItem(htmlEncryptionKey, passwordObject);
    } else {
      navigator.notification.alert(
        "You have entered wrong Password",
        null,
        applicationName
      );
    }
  };

  window.plugins.Prompt.show(
    "Enter password for this File",
    promptPass,
    null,
    "Submit", // ok button title (optional)
    "Cancel", // cancel button title (optional)
    "yes"
  );
  return false;
}

function openEmptyFile() {
  function promptConfirm(button) {
    if (button == 1) {
      sheetData = document.getElementById("emptysheetdata").value;
      console.log(sheetData);
      SocialCalc.WorkBookControlInsertWorkbook(sheetData);
      SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.editor.state =
        "start";
      SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.ExecuteCommand(
        "redisplay",
        ""
      );
      $.mobile.changePage($("#indexPage"), { transition: "slideup" });
    }
  }
  navigator.notification.confirm(
    "Do you want to open a new file without saving current changes ?",
    promptConfirm,
    applicationName,
    "Yes,No"
  );
}

if (!Aspiring) {
  var Aspiring = {};
}

Aspiring.dropbox = function () {
  //console.log("hello");
  var path = "http://www.dropbox.com";

  PhoneGap.exec("ChildBrowserCommand.showWebPage", encodeURI(path));
  console.log(path);
};
