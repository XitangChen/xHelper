/**
 * 常用方法工具辅助类
 * Author: chenxitang@uinnova.com
 * Created Date: 2017-07-28
 * Last Modified: 2017-08-30
 */
;!function (_helper, window, undefined) {
  'use strict';

  var _hasOwn = Object.prototype.hasOwnProperty,
    _slice = Array.prototype.slice,
    helper = xHelper;

  function xHelper(o) {
    if (!(this instanceof xHelper)) { return new xHelper(o); }
    this._ = o;
  }

  /**
   * 扩展对象属性
   * @param deep: Boolean 为true则进行深拷贝。默认为浅拷贝
   * @param target: Object 复制到的目标对象
   * @param sources: Object 拷贝来源对象。可以为多个
   * @returns Object
   */
  function extend(deep, target, sources) {
    var args = arguments,
      slice = function (index) { return _slice.call(args, index); },
      _isObject = function (o) {
        return isObject(o) &&
          !some(['Boolean', 'Number', 'String', 'Function', 'RegExp', 'Symbol', 'Date'], function (type) {
            var type = window[type];
            return type && (o instanceof type);
          });
      },
      deepCopy = function (target, o) {
        if (_isObject(o)) {
          var ret = _isObject(target) ? target : {};
          forEach(o, function (value, key) {
            ret[key] = _isObject(value) ? deepCopy(ret[key], value) : value;
          });
          return ret;
        }
        return o;
      };
    args = _slice.call(args, 0);
    if (typeof deep !== 'boolean') {
      target = deep;
      sources = slice(1);
    } else sources = slice(2);
    if (deep !== true && Object.assign) {
      target = Object.assign.apply(Object, [target].concat(sources));
    } else {
      forEach(sources, function (source) {
        forEach(source, function (value, key) {
          target[key] = deep !== true ? value : deepCopy(target[key], value);
        });
      });
    }
    return target;
  }

  /**
   * 注册命名空间
   * @param namespace: String
   * @param context: Object 检测的上下文
   * @returns {Object}
   */
  function registerNamespace(namespace, context) {
    if (isNullOrUndefined(namespace) || !/^[a-zA-Z_$]\w*(\.[a-zA-Z_$]\w*)*$/.test(namespace)) {
      throw new Error('Invalid namespace!');
    }
    if (!context) context = (0, eval)('this');
    namespace = namespace.split('.');
    forEach(namespace, function (name) {
      if (!isObject(context[name])) context[name] = {};
      context = context[name];
    });
    return context;
  }

  /**
   * 检测传入的命名控件是否存在
   * @param namespace String
   * @param context: Object 检测的上下文
   * @param callback: Function (exists, context, namespace)
   * @returns {object} { exists: exists, context: context }
   */
  function checkNamespace(namespace, context, callback) {
    var exists = false;
    if (namespace) {
      if (!context) context = (0, eval)('this');
      namespace = namespace.split('.');
      exists = !some(namespace, function (name) {
        var index = name.match(/\[(\d+)]$/),
          ok = false;
        if (index) {
          name = name.substring(0, name.length - index[0].length);
          index = index[1];
        }
        if (!isNullOrUndefined(context) && context[name]) {
          context = context[name];
          ok = true;
          if (index) {
            ok = false;
            if (index in context) {
              context = context[index];
              ok = true;
            }
          }
        }
        return !ok;
      });
    }
    if (isFunction(callback)) callback(exists, context, namespace);
    return { exists: exists, context: context };
  }

  /**
   * 获取制定元素的子元素
   * @param el: HTMLElement
   * @param indexOrClassName: Number / String 为Number，表示获取制定索引处的子元素；为String，则匹配元素的className
   * @returns Array(HTMLElement)
   */
  function getChildren(el, indexOrClassName) {
    if (!el) return [];
    var index = isNumber(indexOrClassName) ? indexOrClassName : null,
      className = index === null && !isNullOrUndefinedOrEmpty(indexOrClassName) ? trim(String(indexOrClassName)) : null;
    return filter(filter(el.childNodes, function (child) { return isHTMLElement(child); }), function (child, idx) {
      if (index !== null) {
        return index === idx;
      } else if (!isNullOrUndefinedOrEmpty(className)) {
        return hasClass(child, className);
      } else {
        return true;
      }
    });
  }

  /**
   * 获取元素在页面中的偏移值
   * @param el: HTMLElement
   * @param excludingScrollTop: Boolean，为true，则减去各层级元素的scrollTop值
   * @returns {{left: number, top: number, topIsBodyElement: boolean}}
   * topIsBodyElement返回true，则表示顶层元素为body，否则为其它position为fixed的html元素
   */
  function getOffset(el, excludingScrollTop) {
    var left = 0, top = 0, tmpEl = el, isBody = false;
    if (isHTMLElement(el)) {
      while (tmpEl) {
        left += tmpEl.offsetLeft;
        top += tmpEl.offsetTop;
        if (!tmpEl.offsetParent && tmpEl.tagName.toUpperCase() === 'BODY') isBody = true;
        tmpEl = tmpEl.offsetParent;
      }
      if (excludingScrollTop === true) {
        tmpEl = el;
        while (tmpEl) {
          if (!tmpEl.tagName || /^(BODY|HTML)$/i.test(tmpEl.tagName)) break;
          top -= tmpEl.scrollTop;
          left -= tmpEl.scrollLeft;
          tmpEl = tmpEl.parentNode;
        }
      }
    }
    return { left: left, top: top, topIsBodyElement: isBody };
  }

  function trim(str) {
    if (str) str = ('' + str).replace(/^\s+|\s+$/g, '');
    return str;
  }

  function htmlEncode(s) {
    if (!s) return;
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(s));
    return div.innerHTML.replace(/['"]/g, function (m) {
      switch (m) {
        case "'": return '&#39;';
        case '"': return '&#34;';
      }
      return m;
    });
  }

  function htmlDecode(s) {
    var div = document.createElement('div');
    div.innerHTML = s;
    return div.innerText || div.textContent;
  }

  function hasOwnProp(o, propName) {
    return _hasOwn.call(o, propName);
  }

  function createElement(tagName, properties) {
    var el = document.createElement(tagName);
    isObject(properties) && forEach(properties, function (value, key) {
      el.setAttribute(key, value);
    });
    return el;
  }

  function setStyleProperty(el, propName, propValue) {
    if (el && isHTMLElement(el)) {
      if (isString(propName)) {
        el.style[getCamelCase('' + propName)] = propValue;
      } else if (isObject(propName)) {
        forEach(propName, function (value, key) {
          el.style[getCamelCase(key)] = value;
        });
      }
    }
    return el;
  }

  /**
   * 获取页面最终的合成样式
   * @param el: HTMLElement
   * @param attrName: String/Array(String)
   * @returns {String/Object}
   */
  function getStyle(el, attrName) {
    var style;
    if (el && isHTMLElement(el)) {
      if (el.currentStyle) style = el.currentStyle;
      else style = getComputedStyle(el, null);
      if (attrName && isArray(attrName)) {
        var o = {};
        forEach(attrName, function (name) {
          o[name] = style[getCamelCase(name)];
        });
        return o;
      } else if (attrName && isString(attrName)) {
        return style[getCamelCase('' + attrName)];
      }
    }
    return style;
  }

  /**
   * 设置元素的style值
   * @param el: HTMLElement
   * @param cssOption: String/Object
   * @returns HTMLElement
   */
  function setCssText(el, cssOption) {
    if (!el || !cssOption || !isHTMLElement(el)) return el;
    if (isString(cssOption)) el.style.cssText = '' + cssOption;
    else if (isObject(cssOption)) {
      var o = function (a) {
          var o = {};
          for (var i = 0, length = a.length; i < length; i++) {
            var item = a[i].split(':'),
              key = trim(item[0]);
            key !== '' && (o[key] = trim(item[1]));
          }
          return o;
        }(el.style.cssText.split(';')),
        a = [];
      for (var key in cssOption) {
        var _key = getKebabCase(trim(key));
        if (_key !== '' && hasOwnProp(cssOption, key)) {
          var value = cssOption[key];
          if (value === undefined) delete o[_key];
          else o[_key] = cssOption[key];
        }
      }
      for (var key in o) {
        key && hasOwnProp(o, key) && a.push([key, o[key]].join(':'));
      }
      el.style.cssText = a.join(';');
    }
    return el;
  }

  /**
   * 添加只能订内容的style元素
   * @param cssString: String/Object
   */
  function addStyle(cssString) {
    var doc = window.document,
      style = doc.createElement("style");
    style.setAttribute("type", "text/css");
    if (!isString(cssString) && isObject(cssString)) {
      cssString = function (o) {
        var a = [];
        forEach(o, function (value, key) {
          key && a.push([getKebabCase(key), value].join(':'));
        });
        return a.join(';');
      }(cssString);
    }
    cssString = '' + cssString;
    if (isNullOrUndefinedOrEmpty(cssString)) return;
    if (style.styleSheet) {//IE
      style.styleSheet.cssText = cssString;
    } else {//w3c
      var cssText = doc.createTextNode(cssString);
      style.appendChild(cssText);
    }
    var heads = doc.getElementsByTagName("head");
    if (heads.length) heads[0].appendChild(style);
    else doc.documentElement.appendChild(style);
  }

  function getCamelCase(str) {
    if (str && isString(str) && ('' + str).indexOf('-') > -1) {
      str = ('' + str).replace(/-([a-zA-Z])/g, function ($0, $1) { return $1.toUpperCase(); });
    }
    return str;
  }

  function getKebabCase(str) {
    if (str && isString(str) && ('' + str).length > 1) {
      str = ('' + str);
      str = str[0] + str.substring(1).replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
    }
    return str;
  }

  function forEach(a, callback) {
    if (isArray(a) && Array.prototype.forEach) a.forEach(callback);
    else {
      if (isArray(a)) {
        for (var i = 0, length = a.length; i < length; i++) { callback(a[i], i, a); }
      } else if (isObject(a)) {
        for (var key in a) _hasOwn.call(a, key) && callback(a[key], key, a);
      }
    }
    return a;
  }

  function filter(a, callback) {
    var b = [];
    if (!isNullOrUndefinedOrEmpty(a)) {
      if (isArray(a) && Array.prototype.filter) return a.filter(callback);
      forEach(a, function (value, key) { callback(value, key, a) && b.push(value); });
    }
    return b;
  }

  function map(a, callback) {
    var newA = [];
    if (!isNullOrUndefinedOrEmpty(a)) {
      if (isArray(a) && Array.prototype.map) return a.map(callback);
      forEach(a, function (value, index, a) { newA.push(callback.apply(a, _slice.call(arguments))); });
    }
    return newA;
  }

  function some(a, callback) {
    var b = false;
    if (!isNullOrUndefinedOrEmpty(a)) {
      var _isArray = isArray(a);
      if (_isArray && Array.prototype.some) return a.some(callback);
      if (_isArray) {
        for (var i = 0, length = a.length; i < length; i++) {
          if (callback(a[i], i, a) === true) {
            b = true;
            break;
          }
        }
      } else if (isObject(a)) {
        for (var key in a) {
          if (_hasOwn.call(a, key) && callback(a[key], key, a) === true) {
            b = true;
            break;
          }
        }
      }
    }
    return b;
  }

  function indexOf(a, searchElement, fromIndex) {
    var index = -1,
      fn = function(searchValue, index) {
        var len = a.length >>> 0;
        index |= 0;
        if (index < 0) index = Math.max(len - index, 0);
        else if (index >= len) return -1;
        if (searchValue === undefined) {
          do {
            if (index in a && a[index] === undefined) return index;
          } while (++index !== len);
        } else {
          do {
            if (a[index] === searchValue) return index;
          } while (++index !== len);
        }
        return -1;
      };
    if (isString(a)) {
      index = ('' + a).indexOf(searchElement, fromIndex);
    } else if (isArray(Array)) {
      if (Array.prototype.indexOf) index = a.indexOf(searchElement, fromIndex);
      else index = fn(searchElement, fromIndex);
    } else if (isObject(a) && 'length' in a) {
      index = fn(searchElement, fromIndex);
    }
    return index;
  }

  /**
   * 数组去重
   * @param a:Array
   * @param enableSorting: Boolean，为true，则现对数组排序再去重
   * @param  notEqualComparator: Function (currentVal, existedVal, enableSorting)，返回true表示不相等
   * @returns {*}
   */
  function unique(a, enableSorting, notEqualComparator) {
    if (!(isArray(a) && a.length)) return a;
    var newA = [], o = {},
      enableSorting = enableSorting === true,
      flag = notEqualComparator && isFunction(notEqualComparator);
    if (enableSorting) {
      a.sort();
      newA.push(a[0]);
    }
    forEach(a, function (value) {
      if (enableSorting) {
        if (flag) {
          if (notEqualComparator(value, newA[newA.length - 1], enableSorting)) newA.push(value);
        } else {
          if (value !== newA[newA.length - 1]) newA.push(value);
        }
      } else {
        if (flag) {
          if (notEqualComparator(value, o, enableSorting)) {
            newA.push(value);
          }
        } else {
          if (!o[value]) {
            o[value] = 1;
            newA.push(value);
          }
        }
      }
    });
    return newA;
  }

  function getClassObject(el) {
    var o = {},
      a = el && isHTMLElement(el) && el.getAttribute('class');
    forEach(a && a.split(' ') || [], function (className) {
      if (className !== '') o[className] = true;
    });
    return o;
  }

  /**
   * 返回class属对象组成成的以空格分割的类名
   * @param o: 2Object { className1: true, className: true, className3: false }
   * @returns {String}
   */
  function getClassNameFromClassObject(o) {
    var name = [];
    if (o) forEach(o, function (value, key) { if (value === true) name.push(key); });
    return name.join(' ');
  }

  /**
   * 删除制定元素的CSS样式类
   * @param el: HTMLElement
   * @param className: String / Array(String)
   * @returns HTMLElement
   */
  function removeClass(el, className) {
    if (isHTMLElement(el)) {
      var o = getClassObject(el),
        attrName = 'class';
      if (isArray(className)) forEach(className, function (name) { o[name] = false; });
      else o[className] = false;
      el.setAttribute(attrName, getClassNameFromClassObject(o));
      if (el.getAttribute(attrName) === '') el.removeAttribute(attrName);
    }
    return el;
  }

  /**
   * 添加CSS样式类至制定元素
   * @param el: HTMLElement
   * @param className: String / Array(String)
   * @returns HTMLElement
   */
  function addClass(el, className) {
    if (isHTMLElement(el)) {
      var o = getClassObject(el);
      if (isArray(className)) forEach(className, function (name) { o[name] = true; });
      else o[className] = true;
      el.setAttribute('class', getClassNameFromClassObject(o));
    }
    return el;
  }

  /**
   * 判断元素是否已添加指定样式类名
   * @param el: HTMLElement
   * @param className: String
   * @returns Boolean
   */
  function hasClass(el, className) {
    var o = getClassObject(el);
    return o[className] === true;
  }

  /**
   * 在样式类名前添加点号
   * @param className: String/Array(String)
   * @param splitter: String 当className为数组时，串合各项的分隔符，默认为空字符串
   * @returns String
   */
  function dotWithClassName(className, splitter) {
    var handler = function (className) {
      className = '' + className;
      if (className !== '' && className.indexOf('.') !== 0) className = '.' + className;
      return className;
    };
    if (isArray(className)) {
      className = map(className, function (name) { return handler(name); })
        .join(isNullOrUndefined(splitter) ? '' : '' + splitter);
    } else if (!isNullOrUndefinedOrEmpty(className)) className = handler(className);
    return className;
  }

  function isNullOrUndefined(o) {
    return o === undefined || o === null || typeof o === 'unknown';
  }

  function isNullOrUndefinedOrEmpty(o) {
    return isNullOrUndefined(o) || o === '';
  }

  function isHTMLElement(o) {
    if (HTMLElement && o instanceof HTMLElement) return true;
    if (o && o.nodeType && o.nodeType === 1) return true;
    return false;
  }

  /**
   * 判断对象是否为指定类型
   * @param o: Object
   * @param type: String/Function
   * @returns {Boolean}
   */
  function isType(o, type) {
    var typeString = type;
    if (type instanceof Function) {
      typeString = type.toString().match(/^\s*function +([a-zA-Z$_]\w*)?\(/)[1];
    } else type = null;
    typeString = ('' + typeString).toLowerCase();
    if (type === null) {
      type = typeString.split('');
      type = window[type.shift().toUpperCase() + type.join('')];
    }
    return type && o instanceof type || typeString && typeof o === typeString;
  }

  function isObject(o) {
    return o !== null && o instanceof Object;// typeof o === 'object';
  }

  function isWindow(obj) {
    return obj != null && obj === obj.window;
  }

  function isPlainObject(obj) {
    var key;
    if (!obj || ({}).toString.call(obj) !== '[object Object]' || obj.nodeType || isWindow( obj ) ) {
      return false;
    }
    if ( obj.constructor &&
      !_hasOwn.call( obj, "constructor" ) &&
      !_hasOwn.call( obj.constructor.prototype || {}, "isPrototypeOf" ) ) {
      return false;
    }
    for ( key in obj ) {}
    return key === undefined || _hasOwn.call( obj, key );
  }

  function isEmptyObject(obj) {
    var name;
    for (name in obj) { return false; }
    return true;
  }

  function isFunction(o) {
    return typeof o === 'function';
  }

  function isString(o) {
    return typeof o === 'string';
  }

  function isNumber(o) {
    return typeof o === 'number' && isFinite(o);
  }

  function isBoolean(o) {
    return typeof o === 'boolean';
  }

  function isArray(o) {
    if (Array.isArray) return Array.isArray(o);
    return Object.prototype.toString.call(o) === '[object Array]';
  }

  function isPromise(o) {
    var key = 'then';
    return o && some([o, o.prototype], function (o) {
      return key in o && isFunction(o[key]);
    });
  }

  function Deferred() {
    var STATUS = ['pending', 'resolved', 'rejected'], status = STATUS[0], thens = [], args = [], promise,
      thenPromise, thenPromises = [],
      hasPromise = typeof Promise === 'function' && isPromise(Promise),
      o = {
        resolve: function () {
          if (status !== STATUS[0]) return this;
          args = _slice.call(arguments);
          status = STATUS[1];
          if (hasPromise) run(args);
          else setTimeout(function () { run(args); }, 0);
          return this;
        },
        reject: function () {
          if (status !== STATUS[0]) return this;
          args = _slice.call(arguments);
          status = STATUS[2];
          if (hasPromise) run(args);
          else setTimeout(function () { run(args); }, 0);
          return this;
        },
        then: function (resolve, reject) {
          thens.push(_slice.call(arguments));
          if (status !== STATUS[0]) run(args);
          return isPromise(thenPromise) ? thenPromise : (function (defer) {
            thenPromises.push(defer);
            return defer;
          })(Deferred());
        },
        done: function (resolve) {
          return this.then(resolve);
        },
        catch: function (rejected) {
          return this.then(undefined, rejected);
        },
        promise: function () {
          return { then: this.then, done: this.done };
        }
      };
    function run(args) {
      if (hasPromise) {
        if (!promise) thenPromise = promise = Promise[status === STATUS[2] ? 'reject' : 'resolve'].apply(Promise, args);
        while (thens.length) thenPromise = promise.then.apply(promise, thens.shift());
      } else if (status !== STATUS[0]) {
        while (thens.length) {
          var a = thens.shift(), handler;
          switch (status) {
            case STATUS[1]: handler = a[0]; break;
            case STATUS[2]: handler = a[1]; break;
          }
          isFunction(handler) && (thenPromise = handler.apply(null, args));
        }
      }
      while (thenPromises.length) thenPromises.shift().resolve();
    }
    return o;
  }

  function addEventListener(dom, eventName, handler) {
    if (!dom) return;
    if (dom.attachEvent) dom.attachEvent('on' + eventName, handler);
    else if (dom.addEventListener) dom.addEventListener(eventName, handler, false);
    return dom;
  }

  function removeEventListener(dom, eventName, handler) {
    if (!dom) return;
    if (dom.detachEvent) dom.detachEvent(eventName, handler);
    else if (dom.removeEventListener) dom.removeEventListener(eventName, handler, false);
    return dom;
  }

  /**
   * 以网页元素方式加载文件
   * @param aSrc: Array(String), [key, value] 元素的src/href属性值
   * @param tagName: String, 元素标签名
   * @param oOtherAttributes: Object, 需要设置的元素属性
   * @param callback: Function, 加载完成后调用的函数
   * @param moreArgs: (*), 更多的参数，作为callback调用时的参数
   */
  function loadFile(aSrc, tagName, oOtherAttributes, callback, moreArgs) {
    var _arg = arguments,
      args = _slice.call(_arg),
      aSrc = args.shift(),
      tagName = args.shift(),
      oAttributes = args.shift(),
      callback = function () {},
      doc = document,
      elm = doc.createElement(tagName);
    if (args.length > 0) callback = args.shift();
    for (var key in oAttributes) {
      _hasOwn.call(oAttributes, key) && elm.setAttribute(key, oAttributes[key]);
    }
    if (elm.readyState) {
      elm.onreadystatechange = function () {
        if (some(['loaded', 'complete'], function (value) { return elm.readyState === value; })) {
          elm.onreadystatechange = null;
          callback.apply(_arg, args);
        }
      }
    } else {
      if (!(tagName.toLowerCase() === 'link' && (function (src, ua) {//Hack for Safari 6-
          if (window.openDatabase && ua.indexOf("safari") > -1 && ua.indexOf("chrome") === -1 &&
            ua.indexOf("version") > -1 && parseFloat(ua.match(/version\/([\d.]+)/)[1]) < 6) {
            var timeout = 60000, elapsedTime = 0, intervalTime = 50,
              styleSheets = document.styleSheets,
              curCSSNum = styleSheets.length,
              href = (function (href, pathname) {
                return (src.indexOf('://') !== -1 ? src : ((src.indexOf('/') === 0
                  ? href.substring(0, href.length - pathname.length)
                  : href.substring(0, href.lastIndexOf('/') + 1)) + src)).toLowerCase();
              })(location.href, location.pathname),
              timer = setInterval(function () {
                if (styleSheets.length > curCSSNum) {
                  some(styleSheets, function (styleSheet) {
                    if (styleSheet.href.toLowerCase() === href) {
                      clearInterval(timer);
                      callback.apply(_arg, args);
                      return true;
                    }
                  });
                  curCSSNum = styleSheets.length;
                  elapsedTime += intervalTime;
                  if (elapsedTime > timeout) clearInterval(timer);
                }
              }, intervalTime);
            return true;
          }
          return false;
        })(aSrc[1], navigator.userAgent.toLowerCase()))) {
        if (elm.addEventListener) { addEventListener(elm, 'load', function () { callback.apply(_arg, args); }); }
        else elm.onload = function () { callback.apply(_arg, args); };
      }
    }
    elm.setAttribute(aSrc[0], aSrc[1]);
    var heads = doc.getElementsByTagName("head");
    if (heads.length) heads[0].appendChild(elm);
    else doc.documentElement.appendChild(elm);
  }

  function loadIframe(src, options) {
    options = options || {}
    var defer = Deferred(),
      args = _slice.call(arguments),
      iframe = createElement('iframe', getFunction(options.getProperties)() || {
        src: 'javascript:;',
        frameborder: '0',
        allowtransparency: true,
        allowfullscreen: true,
        style: 'width:100%;height:100%;'
      });
    args.shift();
    if (iframe.readyState) {
      iframe.onreadystatechange = function () {
        if (/^(?:loaded|complete)$/i.test(iframe.readyState)) {
          iframe.onreadystatechange = null;
          defer.resolve();
        }
      }
    } else iframe.onload = function () { defer.resolve(); }
    defer.then(function () { getFunction(options.onLoad).apply(iframe, args); });
    iframe.setAttribute('src', src);
    getFunction(options.onInit).apply(iframe, args);
    return iframe;
  }

  /**
   * 以script元素加载制定的js文件至页面
   * @param jsSrc: String
   * @param callback: Function
   */
  function loadScript(jsSrc, callback) {
    var a = _slice.call(arguments),
      src = a.shift();
    a.splice(0, 0, ['src', src], 'script', { type: 'text/javascript' });
    loadFile.apply(arguments, a);
  }

  /**
   * 以link元素加载样式文件至页面
   * @param href: String
   * @param callback: Function
   */
  function loadStyle(href, callback) {
    var a = _slice.call(arguments),
      href = a.shift();
    a.splice(0, 0, ['href', href], 'link', { type: 'text/css', rel: 'stylesheet' });
    loadFile.apply(arguments, a);
  }

  /**
   * 以script标签形式加载多个js文件至页面
   * @param jsSrcs: String/Array(String)
   * @returns {*|{then, done}}，返回Deferred/Promise对象
   */
  function loadScripts(jsSrcs) {
    if (!jsSrcs) jsSrcs = [];
    if (!isArray(jsSrcs)) jsSrcs = [jsSrcs];
    var defer = Deferred(),
      length = jsSrcs.length;
    forEach(jsSrcs, function (jsFile, index) {
      loadScript(jsFile, function () { (index + 1 === length) && defer.resolve(); });
    });
    return defer.promise();
  }

  /**
   * 按顺序以script标签形式加载脚本文件至页面（确保上一个文件已加载完的请款下再继续加载下一个）
   * @param jsSrcs: String/Array(String)
   * @returns {*|{then, done}}，返回Deferred/Promise对象
   */
  function loadScriptInSequence(jsSrcs) {
    var defer = Deferred(),
      handler = function () {
        if (jsSrcs.length === 0) { defer.resolve(); return; }
        loadScripts(jsSrcs.shift()).done(function () {
          if (jsSrcs.length > 0) handler();
          else defer.resolve();
        });
      };
    !isArray(jsSrcs) && (jsSrcs = [jsSrcs]);
    handler();
    return defer.promise();
  }

  /**
   * 获取页面最大z-index值
   * @param elements:Array[HTMLElement] 元素集合
   * @returns {Number}
   */
  function getMaxZIndex(elements) {
    if (isNullOrUndefined(elements) || !isArray(elements)) {
      elements = document.body.getElementsByTagName('*');
    }
    return Math.max.apply(null, map(elements, function (el) {
      var style = getStyle(el, ['position', 'zIndex']);
      if (style && /^(?:absolute|relative|fixed)$/i.test(style['position'])) {
        return parseInt(style['zIndex']) || 0;
      }
      return 0;
    }));
  }

  /**
   * 限制大小，超出范围则等比缩小
   * @param aOrigSize: Array(Number), [width, height]，原始尺寸
   * @param aMaxSize: Array(Number), [width, height]，允许的最大尺寸
   * @returns {Array} [width, height]
   */
  function getScaledSize(aOrigSize, aMaxSize) {
    var a = aOrigSize;
    if (a[0] > aMaxSize[0] || a[1] > aMaxSize[1]) {
      var r = a[0] / a[1];
      if (r > aMaxSize[0] / aMaxSize[1]) {
        a[0] = aMaxSize[0];
        a[1] = a[0] / r;
      } else {
        a[1] = aMaxSize[1];
        a[0] = r * a[1];
      }
    }
    return a;
  }

  /**
   * 检测当前文档是否为标准渲染模式
   * @returns {boolean}
   */
  function isStrictDocMode() {
    return document.compatMode === "CSS1Compat";
  }

  /**
   * 获取浏览器的可见区域大小
   * @returns {Array} [width, height]
   */
  function getViewportSize() {
    var a = [], isStrict = isStrictDocMode();
    a[0] = window.innerWidth ? window.innerWidth :
      ((isStrict) ? document.documentElement.clientWidth : document.body.clientWidth);
    a[1] = window.innerHeight ? window.innerHeight
      : ((isStrict) ? document.documentElement.clientHeight : document.body.clientHeight);
    return a;
  }

  /**
   * 检测时间花费
   * @returns {{init: init, getSpentTime: getSpentTime, logSpentTime: logSpentTime}}
   */
  function TimeSpentHelper() {
    var startTime = new Date().getTime();
    return {
      init: function () { startTime = new Date().getTime(); },
      getSpentTime: function () {
        return new Date().getTime() - startTime;
      },
      logSpentTime: function (msg) {
        console && console.log && console.log(msg || '', 'time spent is:', this.getSpentTime());
      }
    };
  }

  /**
   * 拷贝对象的指定属性
   * @param o: Array/Object
   * @param fields: String/Array(String)/Array(Array(String)). 为['a', 'b', ...]则只复制并返回指定属性组成的对象；
   *   为[['a', 'a1'], ['b', 'b1'], ...]，则复制属性'a','b',...的值，并将key设置为'a1','b1',...
   * @param fieldFilter: Function(value, key, obj), 单项过滤条件，返回false则表示不添加
   * @returns (Array/Object)
   */
  function copyFields(o, fields, fieldFilter) {
    var ret = {};
    if (isObject(o)) {
      var isA = isArray(o);
      isA && (ret = []);
      !isArray(fields) && (fields = ['' + fields]);
      fields = map(fields, function (field) {
        !isArray(field) && (field = [field]);
        return field;
      });
      !isFunction(fieldFilter) && (fieldFilter = function () {});
      forEach(o, function (value, key, o) {
        var targetKey;
        key = '' + key;
        if (fieldFilter(value, key, o) !== false && some(fields, function (field) {
          if (key === '' + field[0]) {
            targetKey = field[1];
            return true;
          }
        })) {
          value = o[key];
          if (!isNullOrUndefined(targetKey)) {
            if (isA) {
              var _ret = {};
              forEach(ret, function (v, i) { _ret[i] = v;  });
              ret = _ret;
              isA = false;
            }
            ret['' + targetKey] = value;
          } else {
            isA ? ret.push(value) : (ret[key] = value);
          }
        }
      });
    }
    return ret;
  }

  function getJSONString(o) {
    if (typeof JSON !== 'undefined' && JSON.stringify) return JSON.stringify(o);
    var stringify = function (o) {
      if (typeof o === 'undefined' || isFunction(o)) return undefined;
      var getStr = function (str) { return '"' + ('' + str).replace(/(["])/g, '\\$1') + '"'; },
        types = ['String', 'Number', 'Boolean', 'Date'];
      if (isType(o, types[3])) o = o.toISOString();
      if (isType(o, types[0])) return getStr(o);
      if (isType(o, types[1]) && isNaN(o)) o = null;
      if (o === null || some([types[1], types[2]], function (type) { return isType(o, type); })) return '' + o;
      var a = [];
      if (isArray(o)) {
        forEach(o, function (v) {
          v = stringify(v);
          a.push('' + (v === undefined ? null : v));
        });
        return '[' + a.join(',') + ']';
      }
      if (isObject(o)) {
        forEach(o, function (v, k) {
          if (v !== undefined) {
            v = stringify(v);
            a.push([getStr(k), v].join(':'));
          }
        });
        return '{' + a.join(',') + '}';
      }
    };
    return stringify(o);
  }

  // 处理查询字符串
  var QueryString = function () {
    var splitters = ['?', '&', '='];
    /**
     * 将含有?的字符串分解，只取?后面的部分
     * @param queryString: String
     * @returns {String}
     */
    function getQueryString(queryString) {
      !isString(queryString) && (queryString = '');
      queryString = '' + queryString;
      var splitter = splitters[0];
      if (!isNullOrUndefinedOrEmpty(queryString) && queryString.indexOf(splitter) > -1) {
        queryString = queryString.split(splitter);
        queryString.shift();
        queryString = queryString.join(splitter);
      }
      return queryString;
    }
    /**
     * 将传入的查询字符串解析为对象
     * @param queryString: String, i.e: a=b&b=1&c=2获?a=b&b=1&c=2或http://localhost/a.html?a=b&b=1&c=2
     * @param isFormatted: Boolean, 为true，则表示传入的queryString为纯粹的以=/&分隔的字符串，不需要格式化
     * @returns {Object}
     */
    function parse(queryString, isFormatted) {
      var o = {};
      isFormatted !== true && (queryString = getQueryString(queryString));
      if (!isNullOrUndefinedOrEmpty(queryString)) {
        var splitter = splitters[2], decode = decodeURIComponent;
        forEach(queryString.split(splitters[1]), function (param) {
          var a = param.split(splitter), key = decode(a.shift());
          if (a.length < 1) key !== '' && (o[key] = true);
          else {
            var value = decode(a.join(splitter));
            if (_hasOwn.call(o, key)) {
              var val = o[key];
              if (!isArray(val)) o[key] = [val];
              o[key].push(value);
            } else o[key] = value;
          }
        });
      }
      return o;
    }
    /**
     * 将解析后的参数对象组装成以?引导的，以=和&分隔组成的字符串
     * @param o: Object
     * @returns {string}, i.e: ?a=1&b=2
     */
    function toString(o) {
      var str = [];
      if (!isNullOrUndefined(o) && isObject(o)) {
        var encode = function (a) { return map(a, function (v) { return encodeURIComponent('' + v); }); },
          getItem = function (a) { return encode(a).join(splitters[2]); };
        forEach(o, function (value, key) {
          if (isBoolean(value)) value === true && str.push(getItem([key]));
          else if (isArray(value)) {
            forEach(value, function (val) { str.push(getItem([key, val])); });
          } else if (isObject(value)) {
            str.push(getItem([key, getJSONString(value)]));
          } else if (!isNullOrUndefined(value)) str.push(getItem([key, value]));
        });
      }
      return str.length === 0 ? '' : splitters[0] + str.join(splitters[1]);
    }
    function add(o, oNewItems) {
      if (isNullOrUndefinedOrEmpty(oNewItems)) return o;
      if (isString(oNewItems)) o['' + oNewItems] = true;
      else if (isObject(oNewItems)) forEach(oNewItems, function (val, key) { o['' + key] = val; });
      return o;
    }
    function addAndReturnString(queryString, oNewItems, isFormatted) {
      if (isNullOrUndefinedOrEmpty(oNewItems)) return queryString;
      var o = parse(queryString, isFormatted);
      add(o, oNewItems);
      return toString(o);
    }
    function getNewItemObj(key, value) {
      var oNewItems;
      if (isNullOrUndefined(value)) oNewItems = key;
      else {
        oNewItems = {};
        oNewItems['' + key] = value;
      }
      return oNewItems;
    }
    function addItem(o, key, value) {
      return add(o, getNewItemObj(key, value));
    }
    function remove(o, keys) {
      if (isNullOrUndefined(keys)) {
        forEach(o, function (val, key) { delete o[key]; });
        o = {};
      } else if (isString(keys) && ('' + keys) !== '') delete o['' + keys];
      else if (isArray(keys)) forEach(keys, function (key) {
        if (isString(key) && ('' + key) !== '') delete o['' + key];
      });
      return o;
    }
    /**
     * 获取指定项的值
     * @param o: Object
     * @param keys: String/Array(String)，当值为String时，返回单项值
     * @returns {String/Object}
     */
    function get(o, keys) {
      var ret = {};
      if (isNullOrUndefined(keys)) ret = o;
      else if (isString(keys) && (keys) !== '') return o[keys];
      else if (isArray(keys)) forEach(keys, function (key) {
        isString(key) && (ret[key] = o[key]);
      });
      return ret;
    }
    function QueryString(queryString) {
      this.original = queryString;
      this.queryString = getQueryString(queryString);
    }
    extend(QueryString, {
      parse: parse,
      add: addAndReturnString,
      addItem: function (queryString, key, value, isFormatted) {
        return addAndReturnString(queryString, getNewItemObj(key, value), isFormatted);
      },
      remove: function (queryString, keys, isFormatted) {
        if (isNullOrUndefinedOrEmpty(keys)) return queryString;
        var o = remove(parse(queryString, isFormatted), keys);
        return toString(o);
      },
      get: function (queryString, keys, isFormatted) {
        return get(parse(queryString, isFormatted), keys);
      },
      toString: toString
    });
    var parsedObjName = '_parsedObj_' + new Date().getTime();
    extend(QueryString.prototype, {
      parse: function () {
        if (!this[parsedObjName]) this[parsedObjName] = parse(this.queryString, true);
        return this[parsedObjName];
      },
      add: function (oNewItems) {
        add(this.parse(), oNewItems);
        return this;
      },
      addItem: function (key, value) {
        addItem(this.parse(), key, value);
        return this;
      },
      remove: function (keys) {
        remove(this.parse(), keys);
        return this;
      },
      get: function (keys) { return get(this.parse(), keys); },
      toString: function () { return toString(this.parse()); }
    });
    return QueryString;
  }();

  /**
   * 判断并返回传入的第一个为function的参数，否则返回一个空函数
   * @param fn: Object
   * @param alternateFn: Object
   * @returns {Function}
   */
  function getFunction(fn, alternateFn) {
    var okFn = function () {};
    some(_slice.call(arguments), function (fn) {
      if (isFunction(fn)) {
        okFn = fn;
        return true;
      }
    });
    return okFn;
  }

  /**
   * 判断并返回传参中第一个符合要求的值项
   * @param valValidator: Function(value)，验证每项合法性的函数，合法则返回true。
   *   当该参数不为Function时，则将该值计入待验证的值项，并且只验证值项不为null和undefined
   * @param value1: Object 待验证的值项
   * @param value2: Object
   * @returns (Object)
   */
  function getValidValue(valValidator, value1, value2) {
    var values = _slice.call(arguments),
      valValidator = values.shift(),
      result;
    if (!isFunction(valValidator)) {
      values.unshift(valValidator);
      valValidator = function (val) { return !isNullOrUndefined(val); }
    }
    some(values, function (value) {
      //取值不为函数，则先执行为函数的值项
      if ((valValidator.type !== 'function' || valValidator.type !== Function) && isFunction(value)) value = value();
      if (valValidator(value) === true) {
        result = value;
        return true;
      }
    });
    return result;
  }

  /**
   * 用不定参数替换字符串里的占位符
   * @param str: String, 里面可包含占位符{0}, {1}, {2}, ...
   * @param args: Object，对应占位符序号的实际值
   * @returns {String}
   */
  function formatString(str, args) {
    if (!isNullOrUndefinedOrEmpty(str)) {
      args = _slice.call(arguments);
      args.shift();
      var length = args.length;
      str = str.replace(/{(\d+)}/g, function ($, $1) {
        var v = args[$1];
        return isNullOrUndefined(v) ? '' : '' + v;
      });
    }
    return str;
  }

  /**
   * 根据布尔值调用并返回不同的结果
   * @param flag: Boolean
   * @param trueVal: Object, true值
   * @param falseVal: Object false值
   * @params nullOrUndefinedVal
   * @returns {*}
   */
  function switcher(flag, trueVal, falseVal, nullOrUndefinedVal) {
    var getResult = function (v) {
      if (isFunction(v)) return v();
      return v;
    };
    if (arguments.length > 3 && isNullOrUndefined(flag)) return getResult(arguments[3]);
    if (flag) return getResult(trueVal);
    return getResult(falseVal);
  }

  /**
   * 获取数组
   * @param a: (*)
   * @param allowEmpty: Boolean，为true，则允许数组项为空字符串。默认为不允许
   * @returns {Array}
   */
  function getArray(a, allowEmpty) {
    if (!isArray(a)) a = (allowEmpty ? isNullOrUndefined : isNullOrUndefinedOrEmpty)(a) ? [] : [a];
    return a;
  }

  var eventHub = function (hub) {
    var events = {};
    function getEventArray(event) {
      if (!isArray(event)) event = getArray(event.toString().split(' '));
      return event;
    }
    extend(hub, {
      fire: function (event) {
        if (!event) return;
        var args = [].slice.call(arguments, 1);
        forEach(getEventArray(event), function (e) {
          var a = events[e];
          if (a && a.length) {
            forEach(a, function (handler) {
              handler.apply(null, args);
            });
          }
        });
      },
      on: function (event, handler) {
        if (!event) return;
        forEach(getEventArray(event), function (e) {
          var a = events[e];
          if (!isArray(a)) a = events[e] = getArray(a);
          a.push(handler);
        });
      },
      off: function (event, handler) {
        if (!event) return;
        var i, isAll = arguments.length === 1 || handler === undefined;
        forEach(getEventArray(event), function (e) {
          var a = events[e];
          if (a) {
            if (isAll) delete events[e];
            else {
              for (i = 0; i < a.length; i++) {
                if (a[i] === handler) {
                  a.splice(i, 1);
                  i--;
                }
              }
            }
          }
        });
      }
    });
    return hub;
  }({});

  extend(helper, {
    isNullOrUndefined: isNullOrUndefined,
    isNullOrUndefinedOrEmpty: isNullOrUndefinedOrEmpty,
    registerNamespace: registerNamespace,
    checkNamespace: checkNamespace,
    getChildren: getChildren,
    getOffset: getOffset,
    trim: trim,
    htmlEncode: htmlEncode,
    htmlDecode: htmlDecode,
    createElement: createElement,
    setStyleProperty: setStyleProperty,
    getStyle: getStyle,
    setCssText: setCssText,
    addStyle: addStyle,
    getCamelCase: getCamelCase,
    getKebabCase: getKebabCase,
    forEach: forEach,
    filter: filter,
    some: some,
    map: map,
    indexOf: indexOf,
    unique: unique,
    getClassObject: getClassObject,
    getClassNameFromClassObject: getClassNameFromClassObject,
    removeClass: removeClass,
    addClass: addClass,
    hasClass: hasClass,
    extend: extend,
    dotWithClassName: dotWithClassName,
    isType: isType,
    isHTMLElement: isHTMLElement,
    isObject: isObject,
    isWindow: isWindow,
    isPlainObject: isPlainObject,
    isEmptyObject: isEmptyObject,
    isFunction: isFunction,
    isString: isString,
    isArray: isArray,
    isBoolean: isBoolean,
    isNumber: isNumber,
    addEventListener: addEventListener,
    removeEventListener: removeEventListener,
    loader: {
      loadFile: loadFile,
      loadScript: loadScript,
      loadStyle: loadStyle,
      loadScripts: loadScripts,
      loadScriptInSequence: loadScriptInSequence,
      loadIframe: loadIframe
    },
    getMaxZIndex: getMaxZIndex,
    getScaledSize: getScaledSize,
    isStrictDocMode: isStrictDocMode,
    getViewportSize: getViewportSize,
    isPromise: isPromise,
    Deferred: Deferred,
    TimeSpentHelper: TimeSpentHelper,
    copyFields: copyFields,
    getJSONString: getJSONString,
    QueryString: QueryString,
    getFunction: getFunction,
    getValidValue: getValidValue,
    formatString: formatString,
    switcher: switcher,
    getArray: getArray,
    eventHub: eventHub
  });

  extend(helper.prototype, {
    isNullOrUndefined: function () { return isNullOrUndefined(this._); },
    isNullOrUndefinedOrEmpty: function () { return isNullOrUndefinedOrEmpty(this._); },
    registerNamespace: function (namespace) { return registerNamespace(namespace, this); },
    checkNamespace:  function (namespace, callback) { return checkNamespace(namespace, this, callback); },
    getChildren: function (indexOrClassName) {
      var a = [];
      forEach(_slice.call(this._), function (item) {
        a.concat(filter(getChildren(item, indexOrClassName), function (child) {
          return !some(a, function (i) { return i === child; });
        }));
      });
      return a;
    },
    getOffset: function () { return getOffset(isArray(this._) ? this._[0] : this._); },
    trim: function () { return trim(this._); },
    htmlEncode: function () { return htmlEncode(this._); },
    htmlDecode: function () { return htmlDecode(this._); },
    setStyleProperty: function (propName, propValue) {
      if (isArray(this._)) forEach(this._, function (el) { setStyleProperty(el, propName, propValue); });
      else setStyleProperty(this._, propName, propValue);
      return this;
    },
    getStyle: function (attrName) { return getStyle(isArray(this._) ? this._[0] : this._, attrName); },
    setCssText: function (cssOption) {
      if (isArray(this._)) forEach(this._, function (el) { setCssText(el, cssOption); });
      else setCssText(this._, cssOption);
      return this;
    },
    getCamelCase: function () { return getCamelCase(this._); },
    getKebabCase: function () { return getKebabCase(this._); },
    forEach: function (callback) { forEach(this._, callback); return this; },
    filter: function (callback) { return filter(this._, callback); },
    some: function (callback) { return some(this._, callback); },
    map: function (callback) { return map(this._, callback); },
    indexOf: function (searchElement, fromIndex) { return indexOf(this._, searchElement, fromIndex) },
    unique: function (enableSorting, notEqualComparator) { return unique(this._, enableSorting, notEqualComparator); },
    getClassObject: function () { return getClassObject(isArray(this._) ? this._[0] : this._); },
    getClassNameFromClassObject: function () { return getClassNameFromClassObject(this._); },
    removeClass: function (className) {
      if (isArray(this._)) forEach(this._, function (el) { removeClass(el, className); });
      else removeClass(this._, className);
      return this;
    },
    addClass: function (className) {
      if (isArray(this._)) forEach(this._, function (el) { addClass(el, className); });
      else addClass(this._, className);
      return this;
    },
    hasClass: function (className) {
      if (isArray(this._)) return some(this._, function (el) { return hasClass(el, className); });
      return hasClass(this._, className);
    },
    extend: function (deep, sources) {
      var args = _slice.call(arguments);
      if (isBoolean(deep)) args.splice(1, 0, this);
      else args.unshift(this);
      return extend.apply(this, args);
    },
    dotWithClassName: function (splitter) { return dotWithClassName(this._, splitter); },
    isType: function (type) { return isType(this._, type); },
    isHTMLElement: function () { return isHTMLElement(this._); },
    isObject: function () { return isObject(this._); },
    isWindow: function () { return isWindow(this._); },
    isPlainObject: function () { return isPlainObject(this._); },
    isEmptyObject: function () { return isEmptyObject(this._); },
    isFunction: function () { return isFunction(this._); },
    isString: function () { return isString(this._); },
    isArray: function () { return isArray(this._); },
    isBoolean: function () { return isBoolean(this._); },
    isNumber: function () { return isNumber(this._); },
    isPromise: function () { return isPromise(this._); },
    addEventListener: function (eventName, handler) {
      if (isArray(this._)) forEach(this._, function (el) { addEventListener(el, eventName, handler); });
      else addEventListener(this._, eventName, handler);
      return this;
    },
    removeEventListener: function (eventName, handler) {
      if (isArray(this._)) forEach(this._, function (el) { removeEventListener(el, eventName, handler); });
      else removeEventListener(this._, eventName, handler);
      return this;
    },
    copyFields: function (fields, fieldFilter) { copyFields(this._, fields, fieldFilter); },
    getJSONString: function () { return getJSONString(this._); },
    formatString: function () {
      var args = _slice.call(arguments),
        handler = function (str) {
          return formatString.apply(null, [str].concat(args));
        };
      if (isArray(this._)) this._ = map(this._, function (str) { return handler('' + str); });
      else this._ = handler('' + this._);
      return this._;
    },
    switcher: function () {
      var args = _slice.call(arguments);
      return switcher.apply(null, [this._].concat(args));
    }
  });
  if (typeof define === "function" && define.amd) window.xHelper = helper, define(function () { return helper; });
  else if (typeof module === "object" && module.exports) module.exports = helper;
  else window.xHelper = helper;
}(typeof xHelper !== 'undefined' && xHelper, typeof window !== "undefined" ? window : this);
