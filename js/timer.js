function resetPage() {
    stateSetting.classList.remove("state-rotate"), (document.getElementById(
      "minutes"
    ).value =
      "");
  }
  
  function startBreak() {
    var e = document.getElementsByTagName("audio")[0];
    e.play(), (stateSetting = document.getElementById(
      "background-setting"
    )), stateSetting.classList.add("state-rotate"), (document.getElementById(
      "minutes"
    ).value =
      "Enjoy your break"), setTimeout(resetPage, 5e3);
  }
  
  function tick() {
    var e = document.getElementById("time-display"),
      t = Math.floor(secondsRemaining / 60),
      n = secondsRemaining - 60 * t;
    10 > t && (t = "0" + t), 10 > n && (n = "0" + n);
    var a = t + ":" + n;
    (e.innerHTML = a), 0 === secondsRemaining &&
      (clearInterval(timerInterval), startBreak()), secondsRemaining--;
  }
  
  function startTimer() {
    var e = document.getElementById("minutes").value;
    return (secondsRemaining = 60 * e), 0 > secondsRemaining ||
      isNaN(e) ||
      "" === e
      ? (
          (document.getElementById("minutes").value = ""),
          (document.getElementById("time-display").innerHTML = "00:00"),
          void clearInterval(timerInterval)
        )
      : (
          clearInterval(timerInterval),
          void (timerInterval = setInterval(tick, 1e3))
        );
  }
  
  function pauseTimer() {
    secondsRemaining > 0 &&
      (paused === !1
        ? ((paused = !0), (this.value = "Resume"), clearInterval(timerInterval))
        : (
            (paused = !1),
            (this.value = "Pause"),
            (timerInterval = setInterval(tick, 1e3))
          ));
  }
  
  function resetTimer() {
    clearInterval(timerInterval), (document.getElementById("minutes").value =
      ""), (document.getElementById("time-display").innerHTML = "00:00");
  }
  var secondsRemaining,
    timerInterval,
    stateSetting,
    paused = !1;
  window.onload = function() {
    var e = document.getElementById("start");
    e.addEventListener("click", startTimer);
    var t = document.getElementById("stop");
    t.addEventListener("click", pauseTimer);
    var n = document.getElementById("reset");
    n.addEventListener("click", resetTimer);
  };
  