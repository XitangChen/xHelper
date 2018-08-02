/**
 * 加载前提：xHelper/jQuery/doT
 * Created by Xitang Chen on 2017-11-16.
 */
!function (xHelper, $, doT) {
  var forEach = xHelper.forEach,
    isArray = xHelper.isArray,
    isObject = xHelper.isObject,
    isString = xHelper.isString,
    isHTMLElement = xHelper.isHTMLElement,
    isPromise = xHelper.isPromise,
    isFunction = xHelper.isFunction,
    isPlainObject = xHelper.isPlainObject,
    getFunction = xHelper.getFunction,
    getCamelCase = xHelper.getCamelCase,
    htmlEncode = xHelper.htmlEncode,
    extend = xHelper.extend,
    filter = xHelper.filter,
    map = xHelper.map,
    isNullOrUndefined = xHelper.isNullOrUndefined,
    isNullOrUndefinedOrEmpty = xHelper.isNullOrUndefinedOrEmpty,
    prefix = '_$',
    indexHelper = PropNameHelper('index'),
    deleteHelper = PropNameHelper('delete'),
    modeHelper = PropNameHelper('mode'),
    tmplKey = 'templates';

  function getPropName(name) {
    return prefix + name;
  }

  function getFieldItem(key, text) {
    return { key: key, text: text };
  }

  function getFormattedFields(fields) {
    var a = [];
    if (isArray(fields)) forEach(fields, function (field) {
      if (!isNullOrUndefined(field)) {
        if (isArray(field) && field.length) return a.push(getFieldItem(field[0], field[1]));
        if (isFunction(field)) {
          var val = getFormattedFields([field(a)]);
          if (val.length) a = a.concat(val);
          return;
        }
        if (isPlainObject(field)) return a.push(field);
        field = '' + field;
        a.push(getFieldItem(field, field));
      }
    });
    return a;
  }


  /**
   * 构造函数
   * @param {*} options
   * {
   *   {HTMLElement} el,
   *   {Array(Array(String, String))} fields,
   *   {Boolean} enablePaging,
   *   {Boolean/Object} showSeqCol,
   *   {Boolean/Object} showOpCol
   *   fn: {
   *     {Function} renderTemplate (templateId, data),
   *     {Function} fieldsFormatter (fields)
   *   }
   */
  function TableList(options) {
    if (isString(options) || isHTMLElement(options)) options = { el: options };
    else if (!isObject(options)) options = {};
    var me = this,
      dom = isString(options.el) ? $('#' + options.el) : (options.el instanceof $) ? options.el : $(options.el),
      getSelector = function (name, mode) {
        return 'tr[data' + (mode ? '-' + mode : '') + '-template="' + name + '"]';
      },
      enableBodyScroll = options.enableBodyScroll === true;
    me.tableTools = dom.find('.table-tools');
    me.tableHead = dom.find('.table-head');
    me.tableFoot = dom.find('.table-foot');
    me.tableBody = dom.find('.table-body');
    me.thead = me[enableBodyScroll ? 'tableHead' : 'tableBody'].find('thead, tr[data-is-head="true"]');
    me.tbody = me.tableBody.find('tbody');
    $.extend(me, {
      el: dom,
      options: $.extend(true, options, {
        fn: {
          getWrappedData: function (data) {
            var fn = me.options.fn || {};
            return { data: data, fn: fn };
          },
          getOpCol: function () { return getOpCol(me); },
          getSeqCol: function () { return getSeqCol(me); },
          PropNameHelper: PropNameHelper,
          getFormattedFields: getFormattedFields
        }
      }),
      fields: getFormattedFields(options.fields),
      rowDataKeyName: '_rowData' + new Date().getTime()
    });
    forEach([
      ['headTr', 'row', 'thead'],
      ['bodyTr', 'row', 'tbody'],
      ['th', 'col', 'thead'],
      ['td', 'col', 'tbody']
    ], function (item) {
      var name = item[0] + 'Tmpl',
        getHtml = function (isEdit) {
          var dom = me[item[2]].children(getSelector(item[1], isEdit ? 'edit' : '')),
            id = dom.attr('data-template-id'),
            html = id ? $('#' + id).html() : dom.html(),
            match = !id && html && html.match(/^\s*<!--([\s\S]*)-->\s*$/);
          if (match) html = match[1];
          return html;
        },
        o = options[name],
        normal = isString(o) ? o : isObject(o) && o.default || getHtml() || '';
      if (!me[tmplKey]) me[tmplKey] = {};
      var oTmpl = me[tmplKey][name] = {
        original: {
          default: normal,
          edit: isObject(o) && o.edit || getHtml(true) || normal
        }
      };
      oTmpl.compiled = {
        default: doT.template(normal),
        edit: doT.template(oTmpl.original.edit)
      };
    });
    function triggerHandler(evt) {
      var el = evt.target, topEl = dom[0];
      //上推查找有data-on属性的父元素并触发事件
      while (el && el !== topEl) {
        var dataOn = el.getAttribute('data-on');
        if (dataOn) {
          if (!/\bdisabled\b/.test('' + el.getAttribute('class')) && isNullOrUndefined(el.getAttribute('disabled'))) {
            evt.currentTarget = el;
            getFunction(options[getCamelCase('on-' + dataOn)]).call(el, evt, me);
          }
          break;
        }
        el = el.parentNode;
      }
    }
    dom.on('click', 'tr', function (evt) {
      var $tr = $(this), activeClassName = 'active', $tbody = $tr.closest('tbody');
      if ($tbody[0] === me.tbody[0]) {
        options.multiple !== true && $tbody.children('tr').removeClass(activeClassName);
        $tr.addClass(activeClassName);
      }
      triggerHandler(evt);
      getFunction(options.onTrClick).call(this, evt, me);
    }).on('click', function (evt) {
      triggerHandler(evt);
      getFunction(options.onClick).call(this, evt, me);
    });
  }

  function _getCol(tbl, key, text, configKey) {
    var o = { visible: false, text: isNullOrUndefined(text) ? '' : '' + text, key: key },
      col = tbl.options[configKey];
    if (col) {
      if (col === true) o.visible = true;
      else if (isObject(col) && col.visible === true) extend(o, col);
    }
    return o;
  }

  function getOpCol(tbl) {
    return _getCol(tbl, '_opCol', '', 'showOpCol');
  }

  function getSeqCol(tbl) {
    return _getCol(tbl, '_seqCol', '', 'showSeqCol');
  }

  function PropNameHelper(name) {
    name = getPropName(name);
    return {
      get: function (data) { return data[name]; },
      set: function (data, val) { data[name] = val; return data; }
    };
  }

  extend(PropNameHelper, {
    index: indexHelper,
    delete: deleteHelper,
    mode: modeHelper
  });

  extend(TableList, {
    getPropName: getPropName,
    PropNameHelper: PropNameHelper
  });

  extend(TableList.prototype, {
    getPropName: getPropName,
    PropNameHelper: PropNameHelper,
    load: function (dataSource) {
      dataSource = dataSource || {};
      if (!dataSource.data) dataSource.data = [];
      var me = this,
        data = dataSource.data,
        html = [],
        content = null,
        opCol = getOpCol(me),
        seqCol = getSeqCol(me),
        enablePaging = me.options.enablePaging === true,
        getWrappedData = function (data) {
          return me.options.fn.getWrappedData(data);
        },
        getFields = function () {
          var _data = data, fieldsFormatter = me.options.fn.fieldsFormatter;
          if (!isArray(me.fields)) me.fields = [];
          if (!me.fields.length && _data) {
            if (isArray(_data)) _data = _data[0];
            if (_data) {
              forEach(_data, function (val, key) {
                me.fields.push(getFieldItem(key, key));
              });
            }
          }
          _data = (seqCol.visible ? [getFieldItem(seqCol.key, seqCol.text)] : [])
            .concat(me.fields
              .concat(opCol.visible ? [getFieldItem(opCol.key, opCol.text)] : []));
          if (isFunction(fieldsFormatter)) _data = fieldsFormatter.call(me.options.fn, _data) || _data;
          return _data;
        },
        getTrHtml = function (data, tmpl, isObject, index) {
          var html = [], v = isObject && getFunction(me.options.getItemPrimaryVal)(data, index);
          forEach(getFields(), function (field) {
            var itemData = { key: field.key, value: isObject ? data[field.key] : field.text };
            if (isObject && seqCol.visible && field.key === seqCol.key) itemData.value = index + 1;
            getFunction(me.options.fieldValueFormatter)(itemData, field.key);
            html.push(tmpl(getWrappedData(itemData)));
          });
          return doT.template('<tr{{=it.attr}}>{{=it.html}}</tr>')({
            attr: function () {
              if (isObject) {
                var val = isNullOrUndefinedOrEmpty(v) ? data.id : v;
                return (val ? ' data-id="' + htmlEncode(val) + '"' : '') + ' data-index="' + indexHelper.get(data) + '"';
              }
              return '';
            }(),
            html: html.join('')
          });
        };
      me.options.fn.getFields = getFields;
      !isArray(this.fields) && (this.fields = []);
      !isArray(data) && (data = []);
      if (data.length && !this.fields.length) {
        this.fields = function (o) {
          var a = [];
          forEach(o, function (val, key) { a.push([key, key]); });
          return a;
        }(data[0]);
      }
      me.dataSource = dataSource;
      data = filter(data, function (item) {
        if (deleteHelper.get(item) !== true) return item;
      });
      forEach(data, function (item, index) { indexHelper.set(item, index); });
      var oTmpl = me[tmplKey],
        headTrTmpl = oTmpl.headTrTmpl,
        bodyTrTmpl = oTmpl.bodyTrTmpl;
      //thead
      (function (tmplStr, compiledTmpl) {
        if (tmplStr) {
          content = compiledTmpl(getWrappedData(function (a, o) {
            forEach(a, function (field) {
              !isArray(field) && (field = [field, field]);
              o[field[0]] = field[1];
            });
            return o;
          }(getFields(), {})));
        } else {
          compiledTmpl = oTmpl.thTmpl.compiled.default;
          if (compiledTmpl) {
            content = getTrHtml(me.fields, compiledTmpl);
          }
        }
        content !== null && me.thead.html(content);
        content = null;
      })(headTrTmpl.original.default, headTrTmpl.compiled.default);
      //tbody
      (function () {
        function getTmpl(mode, oTmpl) {
          return oTmpl[mode === 'edit' ? mode : 'default'];
        }
        html = [];
        forEach(data, function (item, index) {
          var flag = false,
            mode = modeHelper.get(item),
            tmplStr = getTmpl(mode, bodyTrTmpl.original),
            tmplCompiled = getTmpl(mode, bodyTrTmpl.compiled);
          if (tmplStr) {
            html.push(tmplCompiled(getWrappedData(item)));
          } else {
            flag = true;
            tmplCompiled = getTmpl(mode, oTmpl.tdTmpl.compiled);
            html.push(getTrHtml(item, tmplCompiled, flag, index));
          }
        });
        content = html.join('');
        content !== null && me.tbody.html(content).children('tr').each(function (index) {
          this[me.rowDataKeyName] = data[index];
          getFunction(me.options.rowFormatter).call(me, this, data[index]);
        });
      })();
      //tfoot
      if (me.pager) delete me.pager;
      enablePaging && xHelper.checkNamespace('ui.widget.Pagination', xHelper, function (exists, p) {
        if (exists && p) {
          if (!me.tableFoot) me.tableFoot = $('<div class="table-foot"/>').appendTo(me.tableBody.parent());
          var $box = me.tableFoot.find('.page-nav'),
            po = p.getPageInfoObject(xHelper.copyFields(dataSource, [
              'pageNum', 'pageSize', ['totalRows', 'recordCount']
            ]));
          if (!$box.length) $box = $('<div class="page-nav"/>').appendTo(me.tableFoot);
          me.pager = new p($box[0], po).render(function (evt, pageInfo) {
            getFunction(me.options.onPageItemClick).call(this, evt, pageInfo, me);
          });
        }
      });
      var onInputChange = getFunction(me.options.onInputChange),
        onBeforeInputChange = getFunction(me.options.onBeforeInputChange);
      me.tbody.find('input,select,textarea').on('input change', function (evt) {
        var thiz = this,
          $this = $(thiz),
          rowData = me.getRowData($this.closest('tr')),
          result = onBeforeInputChange.call(thiz, evt, me, rowData),
          defer = $.Deferred();
        if (result === false) return;
        if (isPromise(result)) {
          result.then(function (flag) { if (flag !== false) defer.resolve(); });
        } else defer.resolve();
        defer.then(function () {
          if (!rowData || !isObject(rowData)) return;
          rowData[thiz.name] = function (tagName, type, value) {
            if (tagName !== 'INPUT' || !/^(?:radio|checkbox)$/i.test(type || '')) return value;
            value = map($this.closest('td,th').find('[name="' + thiz.name + '"]:checked').toArray(), function (input) {
              return input.value;
            });
            if (value.length === 1) value = value[0];
            return value;
          }(thiz.tagName.toUpperCase(), thiz.type, $.trim(thiz.value));
          onInputChange.call(thiz, evt, me, rowData);
        });
      });
      getFunction(me.options.onContentLoad).call(me, data, opCol, seqCol);
    },
    reload: function () {
      this.load(this.dataSource);
    },
    getRowData: function (trEl) {
      if (trEl instanceof $) trEl = trEl[0];
      return trEl && trEl[this.rowDataKeyName];
    },
    getRowIndex: function (rowData) {
      var index = rowData && indexHelper.get(rowData);
      return isNullOrUndefinedOrEmpty(index) ? -1 : index;
    }
  });
  xHelper.registerNamespace('ui.widget', xHelper).TableList = TableList;
}(xHelper, $, doT);
