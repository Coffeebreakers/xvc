var xvc = {
  
	init: function() {
		xvc.stringBundle = document.getElementById('xvc_stringbundle');
		xvc.outputFormats = xvc.stringBundle.getString('xvc.outputFormats').split(',');
		xvc.checkEncoder(xvc.outputFormats);
		xvc.initRemix();
		
		/*if (document.getElementById('appcontent')) {
			document.getElementById('appcontent').addEventListener('DOMContentLoaded', xvc.run, true);
		}*/
	},
	/*
	run: function(event) {
		
		xvc.document = event.originalTarget;
		
		if (xvc.isMediaPage() && xvc.isMediaVideo()) {
			
			xvc.mediaId = xvc.document.getElementById('postMediaId').value;
			xvc.mediaStorage = xvc.document.getElementById('postMediaFileStorage').value;
			xvc.mediaHashId = xvc.document.getElementById('postMediaHashId').value;
			xvc.mediaExtension = xvc.stringBundle.getString('xvc.media.fileExtension');
			xvc.mediaFlv = xvc.mediaStorage + '/' + xvc.mediaId + xvc.mediaExtension;
			
			var newA = xvc.document.createElement('a');
			var newLi = xvc.document.createElement('li');
			var mediaActions = xvc.document.getElementById('mediaActions');
			
			newA.id = 'downloadVideo';
			newA.href = xvc.mediaFlv;
			newA.textContent = xvc.stringBundle.getString('xvc.downloadLink.caption');
			newLi.style.background = 'transparent url(http://mais.i.uol.com.br/images/action-downloadvideo.gif) no-repeat scroll 0 0';
			newLi.appendChild(newA);
			mediaActions.appendChild(newLi);
			
			newA.addEventListener('click', xvc.downloadMedia, false);
			
		}
		
	},
	
	isMediaPage: function() {
		return (xvc.document.location.href.toString().match(xvc.stringBundle.getString('xvc.urlPattern')));
	},
	
	isMediaVideo: function() {
		return (xvc.document.getElementById('postMediaType') && xvc.document.getElementById('postMediaType').value == 'V');
	},
	
	downloadMedia: function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		if(xvc.showFileSave() && xvc.saveFileToDisk()) {
			xvc.executeConverterLaunch(xvc.outputFormats);
		}
	},
	
	showFileSave: function() {
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var filePicker = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
		
		filePicker.init(window, xvc.stringBundle.getString('xvc.fileSave.title'), nsIFilePicker.modeSave);
		filePicker.appendFilter(xvc.stringBundle.getString('xvc.fileSave.filter'), '*' + xvc.mediaExtension);
		filePicker.appendFilters(nsIFilePicker.filterAll);
		filePicker.defaultString = xvc.mediaHashId.replace(/(.*)-[^-]*$/,"$1") + xvc.mediaExtension;
		
		var result = filePicker.show();
		if (result == nsIFilePicker.returnOK || result == nsIFilePicker.returnReplace) {
			xvc.filePointer = filePicker.file;
			xvc.inputFiles = new Array(filePicker.file.path.toString());
			return true;
		} else {
			return false;
		}
	},
	
	saveFileToDisk: function (){
		var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
		var webBrowserPersist = Components.classes['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].createInstance(Components.interfaces.nsIWebBrowserPersist);
		
		try {
			webBrowserPersist.saveURI(ioService.newURI(xvc.mediaFlv, null, null), null, null, null, '', xvc.filePointer);		
			return true;
		} catch(e) {
			alert(e);
			return false;
		}
	},*/
	
	// Ugly, but the only way to launch external command line programs with parameters :-(
	executeConverterLaunch: function(outputFormats) {
		var directory = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);
		var localFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
		var fileOutputStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);

		var fileContent = "chcp 1252\n" + xvc.stringBundle.getFormattedString('xvc.homeCommand' , [directory.path]) + "\n";
		for(var i in xvc.inputFiles) {
			for(var j in outputFormats) {
				var encoderPath = xvc.stringBundle.getString('xvc.encoder.path.' + outputFormats[j]);
				var encoderArgs = xvc.stringBundle.getFormattedString( ('xvc.encoder.args.' + outputFormats[j]) , [ xvc.inputFiles[i], (xvc.inputFiles[i].replace(/\.[^.]*$/,'') + '_' + outputFormats[j]), (xvc.inputFiles[i].replace(/\.[^.]*$/,'')) ] );
				
				fileContent += '"' + encoderPath + '" ' + encoderArgs + "\n";
			}
		}
		fileContent += xvc.stringBundle.getFormattedString('xvc.revealCommand', [xvc.inputFiles[0]]);
		
		try {
			localFile.initWithPath(xvc.stringBundle.getFormattedString('xvc.batchFile' , [directory.path]));
			fileOutputStream.init(localFile, 0x02 | 0x08 | 0x20, 00666, 0)
			fileOutputStream.write(fileContent, fileContent.length)
			fileOutputStream.close();
			localFile.launch();
		} catch (e) {
			alert(e);
		}
	},
	
	// Sadly the following function doesn't work with command line programs (like mencoder) :-(
	executeConverterProcess: function(outputFormats) {
		var localFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
		var process = Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
		
		for(var i in xvc.inputFiles) {
			for(var j in outputFormats) {
				var encoderPath = xvc.stringBundle.getString('xvc.encoder.path.' + outputFormats[j]);
				var strEncoderArgs = xvc.stringBundle.getFormattedString( ('xvc.encoder.args.' + outputFormats[j]) , [xvc.inputFiles[i].replace(/\.[^.]*$/,'')] );
				var encoderArgs = strEncoderArgs.match(/-[^-]*/g);
				if(encoderArgs === null) { encoderArgs = new Array };
				encoderArgs.unshift(xvc.inputFiles[i]);
				//prompt('',encoderArgs.join(' '));
				
				try {
					localFile.initWithPath(encoderPath);
					process.init(localFile);
					process.run(false, encoderArgs, encoderArgs.length);
				} catch(e) {
					alert(e);
				};
			}
		}
	},
	
	checkEncoder: function(formats) {
		var localFile = Components.classes['@mozilla.org/file/local;1'].getService(Components.interfaces.nsILocalFile);
		
		for(var i in formats) {
			var encoderPath = xvc.stringBundle.getString('xvc.encoder.path.' + formats[i]);
			
			try {
				localFile.initWithPath(encoderPath);
				if (!localFile.exists()){
					alert( xvc.stringBundle.getFormattedString('xvc.alert.encoderNotFound', [formats[i], encoderPath]) )
					xvc.installEncoder(encoderPath);
				};
			} catch(e) {
				alert(e);
			}
		}
		return true;
	},
	
	installEncoder: function(encoderPath){
		var process = Components.classes["@mozilla.org/process/util;1"].getService(Components.interfaces.nsIProcess);
		var localFile  = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
		var extensionPath = Components.classes['@mozilla.org/extensions/manager;1'].getService(Components.interfaces.nsIExtensionManager).getInstallLocation('xvc@mais.uol.com.br').getItemLocation('xvc@mais.uol.com.br');
		var installerPath = extensionPath.path + '\\' + encoderPath.toString().match(/([^\\]*)\.[^.]*$/)[1] + '_installer.exe';
		
		try {
			localFile.initWithPath(installerPath);
			if (localFile.exists()){
				process.init(localFile);
				process.run(true, [], 0);
			} else {
				alert( xvc.stringBundle.getFormattedString('xvc.alert.installerNotFound', [installerPath]) );
			}
		} catch(e) {
			alert(e);
		}
	},
	
	initRemix: function() {
		xvc.availableFormats = xvc.stringBundle.getString('xvc.availableFormats').split(',');
		xvc.checkEncoder(xvc.availableFormats);
		
		var newMenu = document.createElement('menu');
		var popup = newMenu.appendChild(document.createElement('menupopup'));
		newMenu.setAttribute('label', xvc.stringBundle.getString('xvc.convertLocalFile'));
		
		for(var i in xvc.availableFormats) {
			popup.appendChild( xvc.addFormatMenu(xvc.availableFormats[i], xvc.stringBundle.getFormattedString('xvc.convertToFormat' , [ xvc.stringBundle.getString('xvc.encoder.name.' + xvc.availableFormats[i])] )) )
		}
		popup.appendChild( xvc.addFormatMenu(xvc.availableFormats.join(','), xvc.stringBundle.getString('xvc.convertToAllFormats')) );
		
		document.getElementById('menu_ToolsPopup').insertBefore(newMenu, document.getElementById('sanitizeSeparator'));
		document.getElementById('contentAreaContextMenu').insertBefore(newMenu, document.getElementById('sanitizeSeparator'));
	},
	
	addFormatMenu: function(format, label) {
		var newMenuItem = document.createElement('menuitem');
		newMenuItem.setAttribute('format' , format);
		newMenuItem.setAttribute('label' , label);
		newMenuItem.addEventListener('command', xvc.convertMedia, false);
		return newMenuItem;
	},
	
	convertMedia: function(event) {
		if(xvc.showFileOpen()){
			xvc.executeConverterLaunch(event.target.getAttribute('format').toString().split(','));
		}
	},
	
	showFileOpen: function() {
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var filePicker = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
		
		filePicker.init(window, xvc.stringBundle.getString('xvc.fileOpen.title'), nsIFilePicker.modeOpenMultiple);
		filePicker.appendFilters(nsIFilePicker.filterAll);
		
		var result = filePicker.show();
		if(result == nsIFilePicker.returnOK) {
			xvc.inputFiles = new Array();
			var files = filePicker.files;
			while (files.hasMoreElements()) {
				xvc.inputFiles.push(files.getNext().QueryInterface(Components.interfaces.nsILocalFile).path.toString());
			}
			return true;
		} else {
			return false;
		}
	}
}

window.addEventListener('load', xvc.init, false);