define(["exports"], function (exports) {
  "use strict";

  var _extends = function (child, parent) {
    child.prototype = Object.create(parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    child.__proto__ = parent;
  };

  var AddonGenerator = (function (Model) {
    var AddonGenerator = function AddonGenerator(properties) {
      Model.call(this, properties);

      this.operations = [];

      this.id = this.id || ("addon" + Math.round(Math.random() * 100000000));
      this.name = this.name || this.id;

      this.packageMetadata = {
        installOrigin: "http://gaiamobile.org",
        manifestURL: "app://" + this.id + ".gaiamobile.org/update.webapp",
        version: 1
      };

      this.packageManifest = {
        name: this.name,
        package_path: "/application.zip"
      };

      this.manifest = {
        name: this.name,
        description: "Generated by Customizer",
        role: "addon",
        type: "certified",
        origin: "app://" + this.id + ".gaiamobile.org",
        customizations: [{
          filter: window.location.origin,
          scripts: ["main.js"]
        }]
      };
    };

    _extends(AddonGenerator, Model);

    AddonGenerator.prototype.generate = function () {
      var script = "/*=AddonGenerator*/\nvar selector = '" + this.getSelector() + "';\nvar el = document.querySelector(selector);\nvar mo = new MutationObserver(function() {\n  var newEl = document.querySelector(selector);\n  if (newEl !== el) {\n    el = newEl;\n    setTimeout(exec, 1);\n    mo.disconnect();\n  }\n});\nmo.observe(document.documentElement, {\n  childList: true,\n  attributes: true,\n  characterData: true,\n  subtree: true\n});\nexec();\nfunction exec() {\n" + this.operations.join("\n") + "\n}\n/*==*/";

      console.log("******** Generated SCRIPT ********", script);

      var applicationZip = new JSZip();
      applicationZip.file("manifest.webapp", JSON.stringify(this.manifest));
      applicationZip.file("main.js", script);

      var packageZip = new JSZip();
      packageZip.file("metadata.json", JSON.stringify(this.packageMetadata));
      packageZip.file("update.webapp", JSON.stringify(this.packageManifest));
      packageZip.file("application.zip", applicationZip.generate({ type: "arraybuffer" }));

      return packageZip.generate({ type: "arraybuffer" });
    };

    AddonGenerator.prototype.getSelector = function () {
      return getSelector(this.target);
    };

    AddonGenerator.prototype.opAddEventListener = function (eventName, callback) {
      this.operations.push("/*=AddonGenerator::addEventListener*/\nel.addEventListener('" + eventName + "', " + callback + ");\n/*==*/");
    };

    AddonGenerator.prototype.opAppendChild = function (childNodeName) {
      this.operations.push("/*=AddonGenerator::appendChild*/\nel.appendChild(document.createElement('" + childNodeName + "');\n/*==*/");
    };

    AddonGenerator.prototype.opInnerHTML = function (html) {
      this.operations.push("/*=AddonGenerator::innerHTML*/\nel.innerHTML = " + JSON.stringify(html) + ";\nif (el.tagName === 'SCRIPT') {\n  eval(el.innerHTML);\n}\nelse {\n  Array.prototype.forEach.call(el.querySelectorAll('script'), function(script) {\n    eval(script.innerHTML);\n  });\n}\n/*==*/");
    };

    AddonGenerator.prototype.opScript = function (script) {
      this.operations.push("/*=AddonGenerator::innerHTML*/\n" + script + "\n/*==*/");
    };

    AddonGenerator.prototype.opRemove = function () {
      this.operations.push("/*=AddonGenerator::remove*/\nel.parentNode.removeChild(el);\n/*==*/");
    };

    AddonGenerator.prototype.opSetAttribute = function (name, value) {
      this.operations.push("/*=AddonGenerator::setAttribute*/\nel.setAttribute('" + name + "', '" + value + "');\n/*==*/");
    };

    AddonGenerator.prototype.opSetProperty = function (name, value) {
      this.operations.push("/*=AddonGenerator::setProperty*/\nel." + name + " = " + JSON.stringify(value) + ";\n/*==*/");
    };

    AddonGenerator.prototype.opSetProperties = function (properties) {
      for (var name in properties) {
        this.setProperty(name, properties[name]);
      }
    };

    AddonGenerator.prototype.opCopyAppend = function (destination) {
      this.operations.push("/*=AddonGenerator::copyAppend*/\nvar destination = document.querySelector('" + getSelector(destination) + "');\nvar template = document.createElement('template');\ntemplate.innerHTML = `" + this.target.outerHTML.replace(/\`/g, "\\`") + "`;\nif (destination) {\n  destination.appendChild(template.content);\n}\n/*==*/");
    };

    AddonGenerator.prototype.opCopyPrepend = function (destination) {
      this.operations.push("/*=AddonGenerator::copyPrepend*/\nvar destination = document.querySelector('" + getSelector(destination) + "');\nvar template = document.createElement('template');\ntemplate.innerHTML = `" + this.target.outerHTML.replace(/\`/g, "\\`") + "`;\nif (destination) {\n  destination.insertBefore(template.content, destination.firstChild);\n}\n/*==*/");
    };

    AddonGenerator.prototype.opCopyAfter = function (destination) {
      this.operations.push("/*=AddonGenerator::copyAfter*/\nvar destination = document.querySelector('" + getSelector(destination) + "');\nvar template = document.createElement('template');\ntemplate.innerHTML = `" + this.target.outerHTML.replace(/\`/g, "\\`") + "`;\nif (destination && destination.parentNode) {\n  if (destination.parentNode.lastChild === destination) {\n    destination.parentNode.appendChild(template.content);\n  }\n  else {\n    destination.parentNode.insertBefore(template.content, destination.nextSibling);\n  }\n}\n/*==*/");
    };

    AddonGenerator.prototype.opCopyBefore = function (destination) {
      this.operations.push("/*=AddonGenerator::copyBefore*/\nvar destination = document.querySelector('" + getSelector(destination) + "');\nvar template = document.createElement('template');\ntemplate.innerHTML = `" + this.target.outerHTML.replace(/\`/g, "\\`") + "`;\nif (destination && destination.parentNode) {\n  destination.parentNode.insertBefore(template.content, destination);\n}\n/*==*/");
    };

    AddonGenerator.prototype.opMoveAppend = function (destination) {
      this.operations.push("/*=AddonGenerator::moveAppend*/\nvar destination = document.querySelector('" + getSelector(destination) + "');\nif (destination) {\n  destination.appendChild(el);\n}\n/*==*/");
    };

    AddonGenerator.prototype.opMovePrepend = function (destination) {
      this.operations.push("/*=AddonGenerator::movePrepend*/\nvar destination = document.querySelector('" + getSelector(destination) + "');\nif (destination) {\n  destination.insertBefore(el, destination.firstChild);\n}\n/*==*/");
    };

    AddonGenerator.prototype.opMoveAfter = function (destination) {
      this.operations.push("/*=AddonGenerator::moveAfter*/\nvar destination = document.querySelector('" + getSelector(destination) + "');\nif (destination && destination.parentNode) {\n  if (destination.parentNode.lastChild === destination) {\n    destination.parentNode.appendChild(el);\n  }\n  else {\n    destination.parentNode.insertBefore(el, destination.nextSibling);\n  }\n}\n/*==*/");
    };

    AddonGenerator.prototype.opMoveBefore = function (destination) {
      this.operations.push("/*=AddonGenerator::moveBefore*/\nvar destination = document.querySelector('" + getSelector(destination) + "');\nif (destination && destination.parentNode) {\n  destination.parentNode.insertBefore(el, destination);\n}\n/*==*/");
    };

    return AddonGenerator;
  })(Model);

  exports["default"] = AddonGenerator;


  function getSelector(element) {
    var current = element;
    var path = [getSpecificSelector(current)];

    while (!current.id && current.nodeName !== "HTML") {
      current = current.parentNode;
      path.push(getSpecificSelector(current));
    }

    return path.reverse().join(">");
  }

  function getSpecificSelector(element) {
    var selector = element.nodeName;

    if (element.id) {
      selector += "#" + element.id;
      return selector;
    }

    Array.prototype.forEach.call(element.classList, function (item) {
      selector += "." + item;
    });

    Array.prototype.forEach.call(element.attributes, function (attr) {
      if (attr.nodeName.toLowerCase() === "class") {
        return;
      }

      selector += "[" + attr.nodeName + "=\"" + attr.nodeValue + "\"]";
    });

    return selector;
  }
});