/**
 * Created by XitangChen on 2017-07-28.
 */
// 自定义下拉列表选项组件定义类
xHelper.registerNamespace('ui.widget', xHelper).DropDownList = function (helper) {
  var isNullOrUndefined = helper.isNullOrUndefined,
    isNullOrUndefinedOrEmpty = helper.isNullOrUndefinedOrEmpty,
    getOffset = helper.getOffset,
    createElement = helper.createElement,
    setStyleProperty = helper.setStyleProperty,
    getStyle = helper.getStyle,
    setCssText = helper.setCssText,
    trim = helper.trim,
    forEach = helper.forEach,
    filter = helper.filter,
    some = helper.some,
    map = helper.map,
    addClass = helper.addClass,
    hasClass = helper.hasClass,
    removeClass = helper.removeClass,
    extend = helper.extend,
    isObject = helper.isObject,
    isFunction = helper.isFunction,
    isString = helper.isString,
    isHTMLElement = helper.isHTMLElement,
    isArray = helper.isArray,
    htmlEncode = helper.htmlEncode,
    addEventListener = helper.addEventListener,
    removeEventListener = helper.removeEventListener;

  function noop() { }

  function getFunction(fn) {
    return isFunction(fn) ? fn : noop;
  }

  function getArray(data) {
    return isArray(data) ? data : isNullOrUndefinedOrEmpty(data) ? [] : [data];
  }

  function dataAdapter(data, selectedValue, noIndex) {
    var a = [];
    selectedValue = getArray(selectedValue);
    data = getArray(data);
    forEach(data, function (option, index) {
      var text = '', value = '';
      if (isString(option)) text = value = option;
      else if (isArray(option)) {
        text = option[0];
        value = option.length > 1 ? option[1] : text;
      } else if (option) {
        text = option.text;
        value = option.value;
      }
      a.push((function (o) {
        if (noIndex !== true) {
          extend(o, {
            _index: index,
            selected: some(selectedValue, function (val) {
              if (val.value === value) {
                if (val.text !== text) val.text = text;
                return true;
              }
            })
          });
        }
        return o;
      })({ text: text, value: value }));
    });
    return a;
  }

  function DropDownList(options) {
    var me = this,
      htmlEl = document.documentElement,
      body = document.body,
      selectedClassName = 'selected',
      iptBox = function (el, tagName) {
        if (isString(el)) el = document.getElementById(el);
        if (!isHTMLElement(el)) throw new TypeError('Not a HTML element!');
        if (!isNullOrUndefinedOrEmpty(tagName)) {
          if (tagName === true) tagName = 'div';
          var wrapperBox;
          if (isString(tagName)) {
            wrapperBox = createElement(tagName);
          } else if (isHTMLElement(tagName)) {
            wrapperBox = tagName;
          } else if (isObject(tagName)) {
            (function (o, tagName) {
              if (isString(tagName) && tagName !== '') {
                delete o.tagName;
                wrapperBox = createElement(tagName, o);
              }
            })(tagName, tagName.tagName);
          }
          if (wrapperBox) {
            el.parentNode.insertBefore(wrapperBox, el);
            wrapperBox.appendChild(el);
          }
        }
        return el;
      }(options.el, options.wrapper),
      enableFilter = options.enableFilter === true,
      reserveInvalidValue = options.reserveInvalidValue === true,
      selectedData = dataAdapter(options.value, null, true),
      optionsData = getOptionsData(dataAdapter(options.optionsData, selectedData)),
      modalBoxClassName = function (className) {
        return ['x-modal-box'].concat(!isNullOrUndefinedOrEmpty(className) && isString(className) ?
          className.split(' ') : []);
      }(options.modalBoxClassName),
      bodyClassName = 'x-dropdown-body',
      indexAttrName = 'data-index',
      itemTemplate = isFunction(options.itemTemplate) ? options.itemTemplate : null,
      splitter = function (splitter) {
        return isNullOrUndefinedOrEmpty(splitter) ? ',' : splitter;
      }(options.multipleValueSplitter),
      multiple = options.multiple === true,
      pagerAttrName = '__xdropdown_pagerinfo__',
      dropDownList, wrapperBox, headerBox, bodyBox, footerBox, ulBox, noResultBox, filterBox, iptFilter,
      modalBox = null,
      // 是否以父元素作为下拉选项显隐触发元素
      triggerEl = options.parentAsTrigger === true ? iptBox.parentNode : iptBox,
      disableInputOverlay = options.disableInputOverlay === true,
      className = (function (className) {
        var a = !isNullOrUndefinedOrEmpty(className) && isString(className) ? className.split(' ') : [];
        if (disableInputOverlay) a.unshift('disable-input-overlay');
        return a;
      })(options.className);

    function createModalBox() {
      var box = document.createElement('div');
      setStyleProperty(addClass(box, modalBoxClassName.concat(className)), 'display', 'none');
      dropDownList = createElement('div', { 'class': 'x-dropdown-box' });
      wrapperBox = createElement('div', { 'class': 'x-dropdown-wrapper' });
      headerBox = createElement('div', { 'class': 'x-dropdown-header' });
      bodyBox = createElement('div', { 'class': bodyClassName });
      footerBox = createElement('div', { 'class': 'x-dropdown-footer' });
      filterBox = createElement('div', { 'class': 'x-filter-box', style: enableFilter ? '' : 'display: none' });
      iptFilter = createElement('input', { type: 'text' });
      ulBox = createElement('ul');
      noResultBox = createElement('div', { 'class': 'no-result' });
      dropDownList.appendChild(wrapperBox);
      forEach([headerBox, bodyBox, footerBox], function (el) { wrapperBox.appendChild(el); });
      forEach([filterBox, ulBox, noResultBox], function (el) { bodyBox.appendChild(el); });
      if (enableFilter) {
        filterBox.appendChild(iptFilter);
        addEventListener(iptFilter, 'input', filterHandler);
      }
      headerBox.innerHTML = getContent(options.header);
      ulBox.innerHTML = getOptionsString(optionsData);
      footerBox.innerHTML = getContent(options.footer);
      box.appendChild(dropDownList);
      body.appendChild(box);
      box.__xdropdown_trigger__ = iptBox;
      //分段加载下拉选项（当滚动至底部时触发）
      addEventListener(ulBox, 'scroll', function (evt) {
        evt = evt || event;
        var target = evt.target,
          data = target[pagerAttrName];
        data && (data = data.data);
        if (data && data.length > 0 && (function (sh, st, ch) {
            return st + ch >= sh - 5;
          })(target.scrollHeight, target.scrollTop, target.clientHeight)) {
          var ul = createElement('ul'), nodes;
          ul.innerHTML = getOptionsString(data);
          nodes = Array.prototype.slice.call(ul.childNodes);
          while (nodes.length) target.appendChild(nodes.shift());
        }
      });
      return box;
    }

    function filterHandler(evt) {
      evt = evt || window.event;
      var value = trim(evt.target.value).toLowerCase();
      setOptionsContent(optionsData.filter(function (dataItem) {
        return !!(dataItem.text && dataItem.text.toLowerCase().indexOf(value) > -1);
      }), true);
    }

    function getOptionsData(data) {
      var length = data.length, selected = false;
      if (!reserveInvalidValue) {
        //单选情况下，只返回第一个匹配为选中（主要防止当有多个相同值时，单选框初始值会变成多个重复值）
        !multiple && forEach(data, function (item) {
          if (item.selected) {
            if (!selected) selected = true;
            else item.selected = false;
          }
        });
        return data;
      }
      filter(selectedData, function (selectedItem, index) {
        if (!some(data, function (dataItem) {
          if (selectedItem.value === dataItem.value) {
            delete selectedItem._invalid;
            return true;
          }
        })) {
          data.push(extend(selectedItem, {
            _invalid: true,
            _index: length + index,
            selected: function () {
              if (multiple) return true;
              //单选情况下，只返回第一个匹配为选中（主要防止当有多个相同值时，单选框初始值会变成多个重复值）
              if (!selected) {
                selected = true;
                return true;
              }
              return false;
            }()
          }));
        }
      });
      return data;
    }

    function getContent(content) {
      if (isFunction(content)) content = content.call(me, iptBox);
      return content && String(content) || '';
    }

    function getOptionsString(data, isFiltering) {
      var str = [];
      if (isFiltering !== true && !some(data, function (item) { return item.selected === true; })) {
        var defaultValue = options.defaultSelectedValue,
          defaultIndex = options.defaultSelectedIndex;
        if (!(isString(defaultValue) && some(data, function (item) {
          if (item.value === defaultValue) {
            item.selected = true;
            return true;
          }
        })) && !isNullOrUndefinedOrEmpty(defaultIndex)) {
          defaultIndex = parseInt(defaultIndex);
          if (!isNaN(defaultIndex)) {
            data[defaultIndex] && (data[defaultIndex].selected = true);
          }
        }
      }
      ulBox && ulBox[pagerAttrName] && (delete ulBox[pagerAttrName]);
      some((function (a) {
        var box = getNoResultBox();
        if (box && a.length === 0 && box.innerHTML === '') box.innerHTML = options.noOptionText || '';
        box && setStyleProperty(box, 'display', a.length === 0 ? 'block' : 'none');
        return a;
      })(filter(data, function (item) {
        return item.selected !== true && item._invalid !== true && !isNullOrUndefined(item.value);
      })), function (option, index, data) {
        if (str.length > 100) {//默认只显示前100条记录，防止量过大时导致浏览器卡顿
          ulBox && (ulBox[pagerAttrName] = { data: data.slice(index) });
          return true;
        }
        var selected = option.selected === true ? ' class="' + selectedClassName + '"' : '';
        str.push('<li' + selected + ' ' + indexAttrName + '="' + option._index + '">' +
          (itemTemplate && interpolate(option, itemTemplate(option)) || option.text) + '</li>');
      });
      return str.join('');
    }

    function interpolate(data, template) {
      var result = template;
      if (isString(template) && template !== '') {
        if (!isArray(data)) data = [data];
        result = [];
        forEach(data, function (dataItem) {
          result.push(template.replace(/{{(.*?)}}/g, function (m, $1) {
            var key = trim($1),
              val = dataItem[key],
              splitter = ':';
            key = key.split(splitter);
            if (key.length > 1 && trim(key[0]) === 'html') {
              key.shift();
              val = htmlEncode(dataItem[trim(key.join(splitter))]);
            }
            return isNullOrUndefined(val) ? '' : String(val);
          }));
        });
        result = result.join('');
      }
      return result;
    }

    function setOptionsContent(data, isFiltering) {
      modalBox && (ulBox.innerHTML = getOptionsString(data, isFiltering));
    }

    function getNoResultBox() { return noResultBox; }
    function getHeader() { return headerBox; }
    function getFooter() { return footerBox; }
    function getBody() { return bodyBox; }

    function positionBox() {
      var offset = getOffset(getStyle(triggerEl, 'display') === 'none' ? triggerEl.parentNode : triggerEl, true),
        isBody = offset.topIsBodyElement,
        scrollSize = function () {
          return {
            top: isBody ? Math.max(htmlEl.scrollTop, body.scrollTop) : 0,
            left: isBody ? Math.max(htmlEl.scrollLeft, body.scrollLeft) : 0
          };
        }(),
        ddbOffset = getOffset(dropDownList.parentNode, true),
        position = {
          left: offset.left - scrollSize.left - ddbOffset.left + 'px',
          top: offset.top - scrollSize.top - ddbOffset.top + 'px',
          minWidth: triggerEl.clientWidth + function (o) {
            var width = 0;
            forEach(o, function (value) { width += parseInt(value) || 0; });
            return width;
          }(getStyle(triggerEl, ['borderLeft', 'borderRight'])) + 'px'
        };
      if (disableInputOverlay) {
        var top = parseInt(getFunction(options.getOffsetTop).call(me, position));
        if (isNaN(top)) top = triggerEl.offsetHeight;
        position.top = parseInt(position.top, 10) + top + 'px';
      }
      getFunction(options.onPosition).call(me, position);
      setCssText(dropDownList, position);
    }

    function getSelectedData(propName) {
      var a = filter(optionsData, function (item) {
        return !!(!isNullOrUndefinedOrEmpty(item.value) && item.selected === true);
      });
      if (reserveInvalidValue) {
        a = selectedData.concat(filter(a, function (item) {
          return !some(selectedData, function (selectedItem) { return selectedItem.value === item.value; });
        }));
      }
      if (propName) {
        return map(a, function (item) { return item[propName]; });
      }
      return a;
    }

    /**
     * 获取已选值，返回数组
     * @param isString: Boolean, default is false
     * @returns String / Array
     */
    function getValue(isString) {
      var selectedValue = getSelectedData('value');
      if (multiple) {
        if (isString) return selectedValue.join(splitter);
        return selectedValue;
      }
      return selectedValue[0];
    }

    /**
     * 获取已选项的显示文字，返回数组
     * @param isString: Boolean
     * @returns String / Array
     */
    function getText(isString) {
      var selectedText = getSelectedData('text');
      return isString ? selectedText.join(splitter) : selectedText;
    }

    function setOptionsData(item, propName, value) {
      var old, changed = false, valueChanged = true;
      if (arguments.length === 1) {
        optionsData = getOptionsData(dataAdapter(item, selectedData));
        changed = true;
        valueChanged = false;
      } else {
        if (!multiple) {
          var selected = filter(optionsData, function (option) {
            return option !== item && option.selected === true;
          });
          if (selected.length) {
            changed = true;
            old = extend(true, [], selected);
            forEach(selected, function (selectedItem) {
              selectedItem.selected = false;
            });
          }
          selectedData.length = 0;
        }
        if (item && item[propName] !== value) {
          (function (o) {
            if (changed) old.push(o);
            else old = o;
          })(extend(true, {}, item[propName]));
          if (!changed) changed = true;
          item[propName] = value;
          if (item.selected === true) {
            !some(selectedData, function (selectItem) { return selectItem.value === item.value; }) &&
            selectedData.push({ text: item.text, value: item.value });
          } else {
            some(selectedData, function (selectItem, index) {
              if (selectItem.value === item.value) {
                selectedData.splice(index, 1);
                return true;
              }
            });
          }
        }
      }
      if (changed) {
        setOptionsContent(optionsData);
        if (!reserveInvalidValue || valueChanged) {
          iptBox.value = getText(true);
          getFunction(options.onChange).call(me, item && item[propName], old);
        }
      }
    }

    function close() {
      modalBox && removeEventListener(modalBox, 'click', clickHandler);
      removeEventListener(window, 'resize', positionBox);
      removeEventListener(window, 'scroll', positionBox);
      if (options.reload === true) {
        modalBox && modalBox.parentNode.removeChild(modalBox);
        modalBox = null;
      } else {
        setStyleProperty(modalBox, 'display', 'none');
        iptFilter && (iptFilter.value = '');
      }
      getFunction(options.onHide).call(me);
    }

    function clickHandler(evt) {
      evt = evt || window.event;
      evt.stopPropagation();
      var target = evt.target, optionSelected = false;
      do {
        if ((target.tagName || '').toUpperCase() === 'LI' && hasClass(target.parentNode.parentNode, bodyClassName)) {
          close();
          optionSelected = true;
          (function (index) {
            var itemData = isNaN(index) ? {} : optionsData[index];
            setOptionsData(itemData, 'selected', true);
            getFunction(options.onSelected).call(me, index, itemData, optionsData);
          })(parseInt(target.getAttribute(indexAttrName)));
          break;
        } else if (target === bodyBox) break;
        target = target.parentNode;
      } while (target);
      if (!optionSelected && hasClass(evt.target, modalBoxClassName[0])) close();
    }

    function show(evt) {
      if (getFunction(options.onBeforeShow).call(me, evt) === false) return false;
      if (!modalBox) {
        modalBox = createModalBox();
        (options.reload === true) && getFunction(options.onReload).call(me);
      }
      (function (className) {
        isString(className) && className !== '' && removeClass(iptBox.parentNode, className);
      })(options.loadingTipClassName);
      setStyleProperty(modalBox, 'display', 'block');
      positionBox();
      (function (header, footer) {
        if (header) {
          header.innerHTML = getFunction(options.header).call(me, iptBox) || options.header || '';
        }
        if (footer) {
          footer.innerHTML = getFunction(options.footer).call(me, iptBox) || options.footer || '';
        }
      })(getHeader(), getFooter());
      getFunction(options.onShow).call(me, iptBox, dropDownList);
      addEventListener(modalBox, 'click', clickHandler);
      if (options.fixed !== true) {
        addEventListener(window, 'resize', positionBox);
        addEventListener(window, 'scroll', positionBox);
      }
    }

    addClass(iptBox.parentNode, className);
    addEventListener(triggerEl, 'click', function (evt) {
      evt = evt || window.event;
      evt.stopPropagation();
      show(evt);
    });
    iptBox.value = getText(true);

    extend(me, {
      el: iptBox,
      triggerEl: triggerEl,
      options: options,
      getOptionsData: function () { return optionsData; },
      setOptionsContent: setOptionsContent,
      setOptionsData: setOptionsData,
      getHeader: getHeader,
      getFooter: getFooter,
      getBody: getBody,
      getSelectedData: getSelectedData,
      getValue: getValue,
      getText: getText,
      setValue: function (value) {
        selectedData = dataAdapter(value, null, true);
        setOptionsData(filter(optionsData, function (item) {
          delete item.selected;
          return item._invalid !== true;
        }));
        iptBox.value = getText(true);
        getFunction(options.onChange).call(me, optionsData, null);
      },
      show: show,
      close: close,
      interpolate: interpolate
    });

    getFunction(options.onload).call(me, options);
  }

  extend(DropDownList, {
    dataAdapter: dataAdapter
  });

  return DropDownList;
}(xHelper);

xHelper.initDropDownList = function (nodes, options) {
  var isFunction = xHelper.isFunction,
    hasClass = xHelper.hasClass,
    addClass = xHelper.addClass,
    removeClass = xHelper.removeClass,
    getChildren = xHelper.getChildren,
    isNullOrUndefined = xHelper.isNullOrUndefined,
    isArray = xHelper.isArray,
    isString = xHelper.isString,
    isObject = xHelper.isObject,
    isHTMLElement = xHelper.isHTMLElement,
    some = xHelper.some,
    forEach = xHelper.forEach,
    filter = xHelper.filter,
    extend = xHelper.extend,
    getCamelCase = xHelper.getCamelCase,
    createElement = xHelper.createElement,
    addEventListener = xHelper.addEventListener,
    DropDownList = xHelper.ui.widget.DropDownList,
    tagClassName = 'tag',
    tagsItemClassName = 'tags-item',
    closeClassName = 'x-icon-close',
    valueAttrName = 'data-value',
    loadingTipClassName = 'loading',
    getTagTemplate = function (enableCloseBtn) {
      var str = '<span class="' + tagClassName + '" ' + valueAttrName + '="{{ html:value }}">{{ text }}';
      if (enableCloseBtn) str += '<i class="' + closeClassName + '"></i>';
      return str + '</span>';
    },
    placeHolder = '<span class="' + tagClassName + ' empty-placeholder">{{ text }}</span>',
    refName = '__xdropdown__';

  !isObject(options) && (options = {});

  function noop () {}
  function getFunction (fn) { return isFunction(fn) && fn || noop; }

  forEach(nodes, function (el) {
    if (!isHTMLElement(el)) return;
    var thisOptions = extend(getFunction(options.getOptions)(el) || {}, (function (o) {
        forEach(el.attributes, function (attr) {
          var name = attr.name;
          if (isString(name) && name.indexOf('data-') === 0) {
            o[getCamelCase(name.substring(5))] = attr.value === 'true' ? true : attr.value;
          }
        });
        return o;
      })({})),
      optionsData = function (data) { return isArray(data) && data || [];  }(thisOptions.optionsData),
      onChange = getFunction(thisOptions.onChange),
      onShow = getFunction(thisOptions.onShow),
      onSelected = getFunction(thisOptions.onSelected),
      itemTemplate = getFunction(thisOptions.itemTemplate),
      onPosition = getFunction (thisOptions.onPosition),
      onReload = getFunction(thisOptions.onReload),
      onHide = getFunction(thisOptions.onHide),
      enableFilter = hasClass(el, 'enable-filter'),
      enableTags = hasClass(el, 'enable-tags'),
      enableCloseBtn = hasClass(el, 'enable-close-btn'),
      selectLike = hasClass(el, 'select-like'),
      dropDownArrowClassName = 'dropdown-arrow',
      value = thisOptions.value || el.value || thisOptions.defaultSelectedValue || '',
      multiple = hasClass(el, 'multiple'),
      noOptionText = isString(thisOptions.noOptionText) ? thisOptions.noOptionText :
        isString(options.noOptionText) ? options.noOptionText : '没有结果',
      processingFlag = 'processing';

    if (el[refName]) {
      getFunction(thisOptions.instanceExistsHandler).call(el[refName], el, thisOptions);
      return;
    }
    if (selectLike) {
      enableTags = true;
      thisOptions.className = function (className) {
        return 'select-like-box' + (className ? ' ' + className : '');
      }(thisOptions.className);
    }

    function getPlaceHolder() {
      return placeHolder.replace(/{{ *text *}}/g, el.getAttribute('placeholder') || '&nbsp;');
    }

    function appendTagEl(template, dropDownList) {
      el.parentNode.insertBefore((function (div) {
        div.innerHTML = template;
        getFunction(thisOptions.tagFormatter).call(dropDownList, div.childNodes[0]);
        return div.childNodes[0];
      })(createElement('div')), el);
    }

    function showTagsHandler(dropDownList) {
      if (!enableTags) return;
      var parentNode = el.parentNode,
        children = getChildren(parentNode),
        selectedData = dropDownList.getSelectedData();
      addClass(parentNode, tagsItemClassName);
      forEach(children, function (elTag) {
        if (hasClass(elTag, tagClassName)) parentNode.removeChild(elTag);
      });
      selectLike && (function (dom) {
        if (isArray(dom) && dom.length) return;
        parentNode.appendChild(createElement('i', { 'class': dropDownArrowClassName }));
      })(getChildren(parentNode, dropDownArrowClassName));
      if ((!isArray(selectedData) || selectedData.length === 0) &&
        !some(getChildren(parentNode), function (el) { return hasClass(el, tagClassName); })) {
        appendTagEl(getPlaceHolder(), dropDownList);
      } else {
        forEach(selectedData, function (item) {
          appendTagEl(dropDownList.interpolate(item, getTagTemplate(enableCloseBtn)), dropDownList);
        });
      }
    }

    function removeTag(target) {
      var tag = target.parentNode,
        value = tag.getAttribute(valueAttrName);
      if (!isNullOrUndefined(value)) {
        filter(dropDownList.getOptionsData(), function (item) {
          (item.value === value) && dropDownList.setOptionsData(item, 'selected', false);
        });
      }
      tag.parentNode && tag.parentNode.removeChild(tag);
    }

    function removeTagHandler(dropDownList) {
      addEventListener(dropDownList.getHeader(), 'click', function (evt) {
        evt = evt || event;
        evt.stopPropagation();
        var target = evt.target;
        if (hasClass(target, closeClassName)) {
          removeTag(target);
          dropDownList.close();
          dropDownList.el.parentNode.click();
        }
      });
    }

    var dropDownList = new DropDownList(extend(thisOptions, {
      el: el,
      value: value,
      multiple: multiple,
      // wrapper: 'span',
      loadingTipClassName: loadingTipClassName,
      multipleValueSplitter: ',',
      optionsData: optionsData,
      noOptionText: noOptionText,
      enableFilter: enableFilter,
      // reserveInvalidValue: true,//保留不在下拉别表中的值
      itemTemplate: function (itemData) {
        return itemTemplate.call(this, itemData) || itemData.text;
      },
      header: function (inputEl) { return '<input type="text" value="' + inputEl.value + '" class="x-form-control">' },
      onShow: function (inputEl, dropDownListEl) {
        if (enableTags) {
          var me = this,
            header = me.getHeader();
          header.innerHTML = '';
          addClass(header, tagsItemClassName);
          forEach(filter(getChildren(el.parentNode), function (node) {
            return hasClass(node, tagClassName);
          }), function (node) {
            var clonedNode = node.cloneNode(true);
            header.appendChild(clonedNode);
          });
        }
        onShow.call(this, inputEl, dropDownListEl);
      },
      onChange: function (newValue, oldValue) {
        showTagsHandler(this);
        onChange.call(this, newValue, oldValue);
      },
      onSelected: function (index, itemData, optionsData) {
        onSelected.call(this, index, itemData, optionsData);
      },
      onPosition: function (position) { onPosition.call(this, position); },
      onReload: function () {
        removeTagHandler(this);
        onReload.call(this);
      },
      onHide: function () { onHide.call(this); },
      onBeforeShow: function (evt) {
        if (!evt) return;
        evt.stopPropagation();
        if (hasClass(evt.target, closeClassName)) {
          return thisOptions.disableReloadOnDel !== true;
        }
      }
    }));
    showTagsHandler(dropDownList);
    el[refName] = dropDownList;
    addEventListener(el.parentNode, 'click', function (evt) {
      evt = evt || event;
      evt.stopPropagation();
      var target = evt.target;
      if (hasClass(target, closeClassName)) {
        removeTag(target);
      } else if (!hasClass(el, processingFlag)) {
        var isPromise = false;
        addClass(el, processingFlag);//防止重复点击处理
        if (isFunction(thisOptions.clickHandler)) {
          addClass(el.parentNode, loadingTipClassName);
          var result = thisOptions.clickHandler.call(dropDownList);
          if (result === false) {//返回false表示不显示下拉列表框
            dropDownList.close();
            removeClass(el.parentNode, loadingTipClassName);
            removeClass(el, processingFlag);
            return;
          } else if (result && xHelper.isPromise(result)) {
            isPromise = true;
            result.then(function (data) {
              dropDownList.show(evt);
              dropDownList.setOptionsData(data);
              removeClass(el, processingFlag);
            });
          }
        }
        if (!isPromise) {
          dropDownList.show(evt);
          removeClass(el, processingFlag);
        }
      }
    });
    removeTagHandler(dropDownList);
  });
};
