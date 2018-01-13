/**
 * Created by chenxitang on 2017-12-26.
 */
!function (xHelper) {
  'use strict';
  var extend = xHelper.extend,
    hasClass = xHelper.hasClass,
    addEventListener = xHelper.addEventListener,
    removeEventListener = xHelper.removeEventListener,
    forEach = xHelper.forEach,
    className = 'pagination';
  function Pagination(el, pageInfo) {
    if (!(this instanceof Pagination)) return new Pagination(el, pageInfo);
    this.el = el;
    this.pageInfo = formatPageInfo(pageInfo);
  }
  function getPageInfoObject(o) {
    var _o = {};
    forEach(['pageSize', 'pageNum', 'recordCount', 'recordCount'], function (key) {
      _o[key] = parseInt(o[key], 10) || 0;
    });
    return _o;
  }
  function formatPageInfo(pageInfo) {
    pageInfo = getPageInfoObject(pageInfo);
    if (pageInfo.pageSize <= 1) pageInfo.pageSize = 1;
    if (pageInfo.pageNum < 1) pageInfo.pageNum = 1;
    if (pageInfo.recordCount < 0) pageInfo.recordCount = 0;
    pageInfo.pageCount = Math.ceil(pageInfo.recordCount / pageInfo.pageSize);
    return pageInfo;
  }
  function getContent(o) {
    formatPageInfo(o);
    var content = ['<div class="' + className + '">'],
      pageCount = o.pageCount,
      itemsCount = parseInt(o.itemsCount, 10) || 9,
      current = o.pageNum,
      start = current - Math.floor(itemsCount / 2),
      end = start + itemsCount - 1,
      index,
      flag = false,
      pushItem = function (index) {
        content.push('<li><span class="page-item num' + (current === index ? ' active' : '') + '">' + index + '</span></li>');
      },
      pushMoreItem = function (className) {
        content.push('<li><span class="page-item more '+ className + '">...</span></li>');
      };
    content.push('<span class="page-item prev' + (o.pageNum < 2 ? ' disabled' : '') + '">&lt;</span>');
    content.push('<ul class="page-list">');
    if (start < 1) {
      start = 1;
      end = start + itemsCount - 1;
    }
    if (end > pageCount) {
      end = pageCount;
      start = end - itemsCount + 1;
      if (start < 1) start = 1;
    }
    if (start > 1) {
      start++;
      pushItem(1);
      if (start > 2) pushMoreItem('prev');
    }
    if (end < pageCount) {
      end--;
      flag = true;
    }
    index = start;
    while (index <= end) {
      pushItem(index);
      index++;
    }
    if (flag) {
      if (end + 1 < pageCount) pushMoreItem('next');
      pushItem(pageCount);
    }
    content.push('</ul>');
    content.push('<span class="page-item next' + (current >= pageCount ? ' disabled' : '') + '">&gt;</span>');
    content.push('<span class="page-item total">共<b>' + pageCount + '</b>页</span>');
    content.push('</div>');
    o.pageItems = {
      start: start,
      end: end,
      count: itemsCount
    };
    return content.join('');
  }
  extend(Pagination, {
    className: className,
    getPageInfoObject: getPageInfoObject,
    getContent: getContent
  });
  extend(Pagination.prototype, {
    render: function (clickHandler) {
      if (!xHelper.isHTMLElement(this.el)) return;
      var pageInfo = this.pageInfo, el = this.el;
      el.innerHTML = getContent(pageInfo);
      if (el._clickHandler) removeEventListener(el, 'click', el._clickHandler);
      el._clickHandler = function (evt) {
        var target = evt.target;
        if (!hasClass(target, 'disabled') && !hasClass(target, 'active')) {
          var match = ('' + target.getAttribute('class')).match(/\b(prev|next|num)\b/);
          if (match) {
            clickHandler.call(this, evt, extend(true, {}, pageInfo, {
              className: match[1],
              isMore: hasClass(target, 'more'),
              getPageNum: function () {
                var className = this.className;
                if (className === 'num') {
                  return parseInt(xHelper.trim(target.textContent || target.innerText), 10);
                }
                var pageNum = this.pageNum,
                  isMore = this.isMore;
                if (className === 'prev') {
                  pageNum = isMore ? pageNum - this.pageItems.count : pageNum - 1;
                  return pageNum < 1 ? 1 : pageNum;
                }
                if (className === 'next') {
                  pageNum = isMore ? pageNum + this.pageItems.count : pageNum + 1;
                  return pageNum > this.pageCount ? this.pageCount : pageNum;
                }
                return 1;
              }
            }));
            evt.stopPropagation();
          }
        }
      };
      addEventListener(el, 'click', el._clickHandler);
      return this;
    }
  });
  xHelper.registerNamespace('ui.widget', xHelper).Pagination = Pagination;
}(xHelper);