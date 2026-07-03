'use client';
import { useEffect, useRef } from 'react';
import './atpreakout.css';
import { mount } from './engine';
import { initAtproto } from './atproto';

export default function Game() {
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const root = ref.current;
    if (!root || started.current) return;      // guard StrictMode double-invoke
    started.current = true;
    const cleanup = mount(root);
    initAtproto(root);
    return () => { cleanup && cleanup(); };
  }, []);

  return (
    <div className="atpreakout wrap" ref={ref}>

  <h1>ATpreakout</h1>
  <p className="sub">ever felt the need to destroy your PDS data? but just in a game?</p>
  <div className="controls">
    <div className="acwrap">
      <input type="text" id="handle" placeholder="yourname.bsky.social" autoComplete="off" spellCheck="false" />
      <div className="ac" id="ac"></div>
    </div>
    <button id="go">load</button>
  </div>
  <div id="status" className="status">enter a handle to scan its repo<span className="blink"></span></div>
  <div id="card" className="card" style={{display:'none'}}>
    <div className="months" id="months"></div>
    <div className="body">
      <div className="days"><span></span><span>mon</span><span></span><span>wed</span><span></span><span>fri</span><span></span></div>
      <div className="grid" id="grid"></div>
    </div>
    <div className="foot">
      <span id="total"></span>
      <span className="legend">less
        <span className="cell"></span><span className="cell l1"></span><span className="cell l2"></span><span className="cell l3"></span><span className="cell l4"></span>
      more</span>
    </div>
  </div>
  <div className="bar" id="playbar" style={{display:'none'}}>
    <button id="play">&#9654; play</button>
    <span className="barhint">smash your contribution blocks</span>
  </div>
  <div className="colhead" id="colhead">
    <span className="lbl">collections</span>
    <a id="selall">all</a><a id="selnone">none</a>
    <span className="barhint">&middot; fine-tune the wall</span>
  </div>
  <div className="cols" id="cols"></div>
  <div id="game" style={{display:'none'}}>
    <div className="hud">
      <span>score <b id="g-score">0</b></span>
      <span>lives <b id="g-lives">x3</b></span>
      <span className="sp"></span>
      <button id="login" className="mini">sign in</button>
      <button id="music" className="mini">music: on</button>
      <button id="mute" className="mini">sound: on</button>
      <button id="back" className="mini">&#8592; graph</button>
    </div>
    <audio id="bgm" loop preload="auto" src="/atpreakout/bgm.mp3"></audio>
    <canvas id="cv"></canvas>
    <p className="ghint">click to launch &middot; move mouse or &#8592;&#8594; &middot; space to fire</p>
    <div className="panels">
      <div className="logwrap">
        <div className="loghead">destroyed</div>
        <div className="log" id="log"><div className="empty">break a block to log it&hellip;</div></div>
      </div>
      <div className="logwrap">
        <div className="loghead">your friends scored<span className="note" id="lbnote"></span></div>
        <div className="log" id="board"><div className="empty">no scores yet&hellip;</div></div>
      </div>
    </div>
  </div>

    </div>
  );
}
