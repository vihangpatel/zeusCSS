Brackets zeusCSS
====================

Convert HTML into CSS just by pasting the HTML DOM structure in the file with .css extension.
This has been desgined to meet the requirements of the HTML designing in the Zeus Learning Pvt Ltd , Mumbai

## Installation ##

### Extension Manager
1. Run Brackets
2. Select _File > Extension Manager...
3. Search for “zeusCSS” extension and click “Install” button

### Manual instalation
1. Under main menu select Help > Show Extensions Folder
2. Git clone this repository inside the "user" folder
3. Restart Brackets

### How to use
1. Copy a chunck of your HTML file
2. Paste it into CSS file
3. For name space related information : 
   Select _Debug > Open Preferences File .
   In this file add two lines inside the '{' '}' JSON object :
   "zeusCSS.nameSpace" : "de-mathinteractive-zeus",
   "zeusCSS.interactivityName" : "my-interactivity"
4. Replace the "nameSpace" attribute with proper namespace string .
   Similarly "interactivityName" should be changed to appropriate string.

----------------

## Changelog ##

###1.0.0
- Initial release