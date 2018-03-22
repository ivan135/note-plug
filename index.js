//名字模块   
var app = {
  until: {},
  store: {}
};

//工具方法模块   
app.until = {
  //获取单个元素
  $: function (selector, node) {
    return (node || document).querySelector(selector);
  },
  //格式化时间
  formatTime: function (ms) {
    var d = new Date(ms);
    var oneNumber = function (s) {
      if (s.toString().length === 1) {
        s = '0' + s;
      }
      return s
    }

    var year = d.getFullYear();
    var month = d.getMonth() + 1;
    var date = d.getDate();

    var hour = d.getHours();
    var minute = d.getMinutes();
    var second = d.getSeconds();

    return year + '-' + oneNumber(month) + '-' + oneNumber(date) + ' ' + oneNumber(hour) + ':' + oneNumber(minute) + ':' + oneNumber(second);
  }
};

//store模块

app.store = {
  __store_key: '__sticky_note__',
  get: function (id) {
    var notes = this.getnotes();
    return notes[id] || {};
  },

  set: function (id, content) {
    var notes = this.getNotes();
    if (notes[id]) {
      Object.assign(notes[id], content);
    } else {
      notes[id] = content;
    }
    localStorage[this.__store_key] = JSON.stringify(notes);
    console.log('saved note: id: ' + id + ' content: ' + JSON.stringify(notes[id]));
  },
  remove: function (id) {
    var notes = this.getNotes();
    delete notes[id];
    localStorage[this.__store_key] = JSON.stringify(notes);
  },
  getNotes: function () {
    return JSON.parse(localStorage[this.__store_key] || '{}');
  }
};

//立即执行函数
(function (until, store) {
  //全局变量
  var $ = until.$;
  var moveNote = null;
  var startX;
  var startY;
  var maxZindex = 0;

  var noteTpl = `
  <i class="u-close"></i>
  <div class="u-edit" contenteditable="true"> <span class="u-underline"></span></div>
  <div class="u-timestamp">
    <span>更新:</span>
    <span class="time"></span>
  </div>
  `;

  function Note(options) {
    // debugger
    var note = document.createElement('div');
    note.className = 'n-note';
    note.id = options.id || 'n-note-' + Date.now();
    note.innerHTML = noteTpl;
    $('.u-edit', note).innerHTML = options.content || '';
    note.style.left = options.left + 'px';
    note.style.top = options.top + 'px';
    note.style.zIndex = options.zIndex;
    document.body.appendChild(note);
    //变量存在this中，方便其他函数使用   
    this.note = note;
    this.updateTime(options.updateTime);
    this.addEvent();
  }

  Note.prototype.updateTime = function (ms) {
    var ts = $('.time', this.note);
    ms = ms || Date.now();
    ts.innerHTML = until.formatTime(ms);
    this.updateTimeInMS = ms;
  }

  Note.prototype.save = function () {
    var that = this
    var dataStore = {
      zIndex: that.note.style.zIndex,
      left: that.note.offsetLeft,
      top: that.note.offsetTop,
      content:$('.u-edit',that.note).innerHTML,
      updateTimeStamp: that.updateTimeInMS
  }
    store.set(this.note.id, dataStore)
  }

  Note.prototype.close = function () {
    document.body.removeChild(this.note);
  }

  //// 便签添加事件
  Note.prototype.addEvent = function () {

    var mousedownHandler = function (e) {
      moveNote = this.note;
      startX = e.clientX - this.note.offsetLeft;
      startY = e.clientY - this.note.offsetTop;
      // console.log(startX);
      // console.log(startY);
      if (parseInt(this.note.style.zIndex) !== maxZindex - 1) {
        this.note.style.zIndex = maxZindex++;
        store.set(this.note.id,{
          zIndex: maxZindex - 1
        })
      }
    }.bind(this);
    this.note.addEventListener('mousedown', mousedownHandler);

    //便签的保存功能   
    var editor = $('.u-edit', this.note);

    var inputTimer;

    var inputHandler = function (e) {
      var content = editor.innerHTML;
      clearTimeout(inputTimer);
      inputTimer = setTimeout(function () {
        var time = Date.now();
        store.set(this.note.id, {
          content: content,
          updateTime: time
        });
        this.updateTime(time);
      }.bind(this), 300);
    }.bind(this);

    editor.addEventListener('input', inputHandler);

    var closeBtn = $('.u-close', this.note);
    var clearHandler = function (e) {
      store.remove(this.note.id);
      this.close(e);
       closeBtn.removeEventListener('click', clearHandler);
      this.note.removeEventListener('mousedown', mousedownHandler);
    }.bind(this);
    closeBtn.addEventListener('click', clearHandler);
  }


  document.addEventListener('DOMContentLoaded', function (e) {
    $('#create').addEventListener('click', function (e) {
      var note = new Note({
        left: Math.round(Math.random() * (window.innerWidth - 220)),
        top: Math.round(Math.random() * (window.innerHeight - 320)),
        zIndex: maxZindex++
      });
      note.save();
    });

    function mousemoveHandler(e) {
      // console.log(e)
      if (!moveNote) {
        return;
      }
      // console.log(e)
      moveNote.style.left = e.clientX - startX + 'px';
      moveNote.style.top = e.clientY - startY + 'px';
    }

    function mouseupHandler(e) {
      if(!moveNote) {
        return;
      }

      store.set(moveNote.id,{        
        left: moveNote.offsetLeft,
        top: moveNote.offsetTop
      });
      moveNote = null;
    }
    document.addEventListener('mousemove', mousemoveHandler);
    document.addEventListener('mouseup', mouseupHandler);

    //初始化notes
    var notes = store.getNotes();
    Object.keys(notes).forEach(function (id) 
    {
      var option = notes[id];
      if(maxZindex < option.zIndex) {
        maxZIndex = option.zIndex;
      }
      new Note(Object.assign(option, {
        id: id
      }));
    });
    maxZindex += 1;
  });
})(app.until, app.store)