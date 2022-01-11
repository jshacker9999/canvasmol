// Flash wrapper for proper cross-browser behavior of ExternalInterface
// (communication between Javascript <=> Flash) when adding SWF dynamically
//  -- from http://code.google.com/p/doctype/wiki/ArticleFixingFlashExternalInterface

function encode_pars(pars) {
    // some example FlashVars, showing how to properly encode them
    // FIXME: delete this or add in your own in order to pass flags into your Flash object
    /*
    var flashVars = 
          'uniqueId=' + encodeURIComponent(id)
        + '&sourceType=string'
        + '&scaleMode=showAll'
        + '&debug=true'
        + '&svgId=' + encodeURIComponent(id);
    */
    
    var tmp = "";
    for(var i in pars) {
        if(tmp) tmp += "&";
        tmp += i + "=" + pars[i];
    }
    return tmp;
}

// for testing SWF->JS calls
function jsAlert(val) {
    alert(val);
}

/** Gets a string suitable for inserting into our document in order to setup our Flash object.

    @param width The width of the Flash object, such as "600".
    @param height The height of the Flash object, such as "300".
    @param id The ID that will be added to the Flash object.
    @param backgroundColor An optional color that will be used for the background, such 
     as 'red'. If you want the Flash to be transparent, set this to null and set 
     backgroundTransparent to true. If you provide a backgroundColor the background will _not_
     be transparent.
    @param backgroundTransparent Whether you want the background of the Flash object to
     show through. Set to true if you want this and make sure backgroundColor is null.
    @param style An optional style string to copy into the Flash object.
    @param className An optional className to copy into the Flash object.
    @param libraryPath A path to the SWF file; useful so you can grab your SWF file if 
    it is relative to where your library is installed. For example, this could be
    '../../'. Make sure that this relative path ends in a slash. 
    @param swfFileName The name of your swf file, such as 'svg.swf'.

    @returns HTML string suitable for inserting somewhere into the page. */
function getFlashString(width, height, id, backgroundColor, backgroundTransparent, style, className, libraryPath, swfFileName) {
    var src = libraryPath + swfFileName;
    var protocol = window.location.protocol;
    if (protocol.charAt(protocol.length - 1) == ':') {
        protocol = protocol.substring(0, protocol.length - 1);
    }
    
    //var flashVars = encode_pars(flashPars);
    var flashVars = "";
    
    var flash =
          '<object\n '
            + 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"\n '
            + 'codebase="'
            + protocol
            + '://fpdownload.macromedia.com/pub/shockwave/cabs/flash/'
            + 'swflash.cab#version=9,0,0,0"\n '
            + 'width="' + width + '"\n '
            + 'height="' + height + '"\n '
            + 'id="' + id + '"\n '
            + 'name="' + id + '"\n '
            + 'style="' + style + '"\n '
            + 'class="' + className + '"\n '
            + '>\n '
            + '<param name="allowScriptAccess" value="always"></param>\n '
            + '<param name="movie" value="' + src + '"></param>\n '
            + '<param name="quality" value="high"></param>\n '
            + '<param name="FlashVars" value="' + flashVars + '"></param>\n '
            + (backgroundColor ? '<param name="bgcolor" value="' 
                                    + backgroundColor + '"></param>\n ' : '')
            + (backgroundTransparent ? 
                                    '<param name="wmode" value="transparent">'
                                    + '</param>\n ' : '')
            + '<embed '
              + 'src="' + src + '" '
              + 'quality="high" '
              + (backgroundColor ? 'bgcolor="' + backgroundColor 
                                     + '" \n' : '')
              + (backgroundTransparent ? 'wmode="transparent" \n' : '')
              + 'width="' + width + '" '
              + 'height="' + height + '" '
              + 'id="' + id + '" '
              + 'name="' + id + '" '
              + 'swLiveConnect="true" '
              + 'allowScriptAccess="always" '
              + 'type="application/x-shockwave-flash" '
              + 'FlashVars="' + flashVars + '" '
              + 'pluginspage="'
              + protocol
              + '://www.macromedia.com/go/getflashplayer" '
              + 'style="' + style + '"\n '
              + 'class="' + className + '"\n '
              + ' />'
          + '</object>';

    return flash;
}

/** Inserts a Flash object into the page.

    @param flash Flash HTML string.
    @param replaceMe Some DOM node already in the document to replace with the Flash object, such as a DIV.
      
    @returns The Flash DOM object. */
function insertFlash(flashStr, replaceMe) {
   var flashObj;
   if (document.all && !navigator.userAgent.indexOf('Opera') >= 0) { // IE
      // Note: as _soon_ as we make this call the Flash will load, even
      // before the rest of this method has finished. The Flash can
      // therefore finish loading before anything after the next statement
      // has run, so be careful of timing bugs.
      replaceMe.outerHTML = flashStr;
   } else { // other browsers
      // do a trick to turn the Flash HTML string into an actual DOM object
      // unfortunately this doesn't work on IE; on IE the Flash is immediately
      // loaded when we do div.innerHTML even though we aren't attached
      // to the document!
      var div = document.createElement('div');
      div.innerHTML = flashStr;
      flashObj = div.childNodes[0];
      div.removeChild(flashObj);
    
      // at this point we have the OBJECT tag; ExternalInterface communication
      // won't work on Firefox unless we get the EMBED tag itself
      for (var i = 0; i < flashObj.childNodes.length; i++) {
         var check = flashObj.childNodes[i];
         if (check.nodeName.toUpperCase() == 'EMBED') {
            flashObj = check;
            break;
         }
      }
    
      // now insert the EMBED tag into the document
      replaceMe.parentNode.replaceChild(flashObj, replaceMe);
   }
    
   return flashObj;
}

// Cross-browser access to SWF object
function getSWF(movieName) {
    if(navigator.appName.indexOf("Microsoft") != -1)
        return window[movieName];
    else
        return document[movieName];
}

/*****************************************************************************************/
// Wrapped SWF function
/*****************************************************************************************/
function reset_molecule_flash(i, points, lines, colors) {
    getSWF("myFlashObject"+i).set_molecule(points, lines, colors);
}

function render_molecule_flash(i) {
    getSWF("myFlashObject"+i).render_molecule();
}

function rotate_molecule_flash(i, angles) {
    getSWF("myFlashObject"+i).rotate_molecule(angles);
}

function toggle_autorotation_flash(i, axis) {
    getSWF("myFlashObject"+i).toggle_autorotation(axis);
}

function toggle_atoms_flash(i, val) {
    getSWF("myFlashObject"+i).toggle_atoms(val);
}

function toggle_bonds_flash(i, val) {
    getSWF("myFlashObject"+i).toggle_bonds(val);
}

function toggle_colors_flash(i, val) {
    getSWF("myFlashObject"+i).toggle_colors(val);
}

function toggle_glow_flash(i, val) {
    getSWF("myFlashObject"+i).toggle_glow(val);
}

function jsCallback(par) {
    if(CALLBACK != undefined) CALLBACK();
}

/*****************************************************************************************/
// Flash wrapper
/*****************************************************************************************/
function flash_div(i) {
    var tmp = '<div class="molecule flash shadow" id="screen'+i+'">';
    tmp += '<div class="dragheader">Loading ...</div>';
    tmp += '<div id="zflash"></div>';
    
    tmp += '<br class="clr"/>';
    tmp += '<div class="b_left touch"> </div>';
    tmp += '<div class="b_right touch"> </div>';
    tmp += '<div class="b_up touch"> </div>';
    tmp += '<div class="b_down touch"> </div>';
    
    tmp += '<div class="button b_x">X</div>';
    tmp += '<div class="button b_y">Y</div>';
    tmp += '<div class="button b_z">Z</div>';
    tmp += '<div class="button b_atoms">Atoms</div>';
    tmp += '<div class="button b_bonds">Bonds</div>';
    tmp += '<div class="button b_col">A-color</div>';
    tmp += '<div class="button b_glow">Glow</div>';
    tmp += '</div>';
    
    return tmp;
}

function create_canvas_flash(width, height, path, file, flash_id, flash_class, dummy_id) {
    var flashStr = getFlashString(width, height, flash_id, "#000000", false, 'border: 0px solid red;', flash_class, path, file);
    var replaceMe = document.getElementById(dummy_id);
    var flashObj = insertFlash(flashStr, replaceMe);
    return flashObj;
}

var CALLBACK;

function create_screen_flash(i, callback) {
    CALLBACK = callback;
    $('#molecules').append($(flash_div(i)));
    // must generate unique SWF url otherwise Explorer will just reuse the same object instance
    // for multiple molecules which leads to weird glitches
    create_canvas_flash(400, 380, 'src/', 'flashmol.swf?'+Math.random(), 'myFlashObject'+i, 'screenFlash', 'zflash');
}

