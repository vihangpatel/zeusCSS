 define(function (require, exports, module) {

    var DocumentManager = brackets.getModule("document/DocumentManager"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        running,
        order;

    function isFileExt(ext) {
        var fileType = DocumentManager.getCurrentDocument().getLanguage()._id;
        if (fileType.match(new RegExp(ext, "i"))) return fileType.toLowerCase();
        return false;
    }

    function getSelectors(el) {
        if (!el) return;
        var selector = [];
        if (el.className && el.className.split) {
            var classes = el.className.split(" ");
            for (var i = 0 ; i < classes.length ; i++) {
                selector.push("." + classes[classes.length - 1 - i]);
            }
        }       
        return selector;
    }

    function reindent(codeMirror, from, to) {
        codeMirror.operation(function () {
            codeMirror.eachLine(from, to, function (line) {
                codeMirror.indentLine(line.lineNo(), "smart");
            });
        });
    }

    function recursive(array, params) {
        params = params || {};
        var can_go = 1;

        function recursive(array, parent, depth, back) {
            if (!can_go) return;
            if (array.length > 0) {
                for (var i = 0; i < array.length; i++) {
                    if (!can_go) return;
                    if (params.callback) {
                        can_go = params.callback(array[i], array, parent, depth, i, back);
                    }
                    if (!can_go) return;
                    if (array && array[i] && array[i].children.length > 0) {
                        recursive(array[i].children, array, depth + 1, i);
                    }
                }
            }
        }
        recursive(array, null, 0, 0);
    }

    function printAdd(what, printed) {
        printed.text = printed.text + what;
    }

    function printIndentedChildren(array, printed, params) {
        var _array,
            selectors = [],
            params = params || {
                open: "{",
                close: "}"
            };
        if (array.length > 0) {
            for (var i = 0; i < array.length; i++) {
                _array = array[i];
                printAdd(
                    _array.selector + " " + params.open + "\n",
                    printed
                );
                if (_array.tag == "a") {
                    printAdd(
                        "&:hover" + params.open + "\n" +
                        params.close + "\n",
                        printed
                    );
                }
                if (_array.all.length) {
                    for (var n in _array.all) {
                        printAdd(
                            "&" + _array.all[n] + params.open + "\n" +
                            params.close + "\n",
                            printed
                        );
                    }
                }
                if (_array.children.length > 0) {
                    printIndentedChildren(_array.children, printed, params);
                }
                printAdd(
                    params.close + "\n",
                    printed
                );
                selectors.push(printed.text);
            }
        }
    }

    function printIndented(array) {
        var printed = {
            text: ""
        };
        printIndentedChildren(array, printed);
        return printed.text.trim().replace(/\n$/, "");
    }

    function printCSSChildren(array, parents, printed) {
        var send = [],
            _array,
            n;
        if (array.length > 0) {
            for (var i = 0; i < array.length; i++) {
                _array = array[i];
                printAdd(
                    (parents.length ? parents.join(" ") + " " + _array.selector : _array.selector) +
                    " {\n}\n",
                    printed
                );
                if (_array.all.length) {
                    for (n in _array.all) {
                        printAdd(
                            parents.length ? parents.join(" ") + " " + _array.selector : _array.selector + _array.all[n] + "{\n}\n",
                            printed
                        );
                    }
                }

                if (array[i].children && array[i].children.length) {
                    send = parents.slice(0);
                    send.push(array[i].selector);
                    printCSSChildren(array[i].children, send, printed);
                }
            }
        }
    }

    function printCSS(array) {
        var printed = {
            text: ""
        };
        printCSSChildren(array, [], printed);
        return printed.text.trim().replace(/\n$/, "");
    }

    function printClean(array) {
        var printed = {
            text: ""
        };
        printIndentedChildren(array, printed, {
            open: "",
            close: ""
        });
        return printed.text.trim().replace(/\n$/, "") + "\n";
    }  

    function getLastDepth(array) {
        var d = 0;
        recursive(array, {
            callback: function (el, array, parent, depth) {
                if (depth > d) {
                    d = depth;
                }
                return true;
            }
        });
        return d;
    }  
   
    function run(codeMirror, change) {
        if (change.origin !== "paste" || change.origin != "paste" || running || !change.text[0].match(/[<>]/mig)) {
            return;
        }
        var file = isFileExt("scss|less|css");
        if (!file) {
            return;
        }

        running = 1;
        // At least 80ms until the next run.
        setTimeout(function () {
            running = 0;
        }, 80);

        var text = change.text,
            allText = "";

        for (var i = 0, l = text.length; i < l; i++) {
            allText = allText + text[i];
        }

        allText = allText.replace(/[\t]+/mig, " ")
            .replace(/[\s]+/mig, " ")
            .replace(/^[\s]+/mig, "")
            .replace(/[\s]+$/mig, "")
            .replace(/(\>)([\s]+)(\<)/mig, "$1$3");

        if (!allText.match(/^(\<)(.*)(\>)$/)) {
            return;
        }

        var object = $("<div>" + allText + "</div>"),
            css = [],
            printed,
            from = codeMirror.getCursor(true),
            to = codeMirror.getCursor(false),
            line = codeMirror.getLine(from.line);

        switch (file) {
        case "css":
            var cssNew = {};
            customPopulate(object,cssNew);
            printed = customPrint(cssNew);
            console.log(printed);
            break;
        default:
            printed = printIndented(css);
        }
        
        

        codeMirror.replaceRange(printed, change.from, from);
        reindent(codeMirror, change.from.line, change.from.line * 1 + printed.match(/\n/mig).length + 1);
    }
    
    function customPopulate(all,css){
        
        var PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
            prefs = PreferencesManager.getExtensionPrefs("zeusCSS"),
            stateManager = PreferencesManager.stateManager.getPrefixedSystem("zeusCSS");
        
        all = all.children();
        var i = 0,
            selectors = [],
            selector,
            prefix = '.' + prefs.get('nameSpace') + '.' + prefs.get('interactivityName');
        
        all.each(function () {
            selectors = getSelectors(this);
            for (var i = selectors.length - 1 ; i >= 0 ; i--){
                css[prefix + ' ' + selectors[i]] = prefix + ' ' + selectors[i];
            }
            customPopulate($(this),css);
        });
        
    }
    
    function customPrint(css){
        var keys = Object.keys(css),
            text = '';
        for(var i = 0 ; i < keys.length ; i++) {
               text += keys[i] + "{\n}\n";
        }
        return text;
    }

    return {
        run: run
    };

});