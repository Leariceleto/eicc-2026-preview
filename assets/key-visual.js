/* Default to the confirmed river artwork; explicit parameters retain design comparisons. */
(function(){
  'use strict';
  var choices=['planet','river','original'];
  var selected=new URLSearchParams(location.search).get('visual');
  if(choices.indexOf(selected)===-1)selected='river';
  document.documentElement.dataset.keyVisual=selected;
  document.addEventListener('DOMContentLoaded',function(){
    var hero=document.querySelector('.hero');
    var controls=hero.querySelector('[data-visual-switch]');
    var stage=hero.querySelector('[data-visual-stage]');
    var media=hero.querySelector('[data-visual-media]');
    var originalHost=hero.querySelector('.wrap');
    var actions=hero.querySelector('.hero-actions');
    var countdown=hero.querySelector('.countdown');
    var nav=document.querySelector('body>nav');
    var navObserver;
    function watchNavigation(){
      if(navObserver)navObserver.disconnect();
      var bounds=stage.getBoundingClientRect();
      var navHeight=nav.getBoundingClientRect().height;
      document.body.classList.toggle('kv-nav-over-hero',!stage.hidden&&bounds.top<=navHeight&&bounds.bottom>navHeight);
      if(stage.hidden)return;
      navObserver=new IntersectionObserver(function(entries){
        document.body.classList.toggle('kv-nav-over-hero',entries[0].isIntersecting);
      },{rootMargin:'-'+navHeight+'px 0px 0px 0px'});
      navObserver.observe(stage);
    }
    function render(value){
      document.documentElement.dataset.keyVisual=value;
      controls.hidden=false;
      stage.hidden=value==='original';
      if(value==='original'){
        hero.insertBefore(controls,stage);
        originalHost.appendChild(countdown);
        originalHost.insertBefore(actions,countdown);
        media.replaceChildren();
      }else{
        hero.appendChild(controls);
        media.replaceChildren(document.getElementById('key-visual-'+value).content.cloneNode(true));
        stage.appendChild(actions);
        stage.appendChild(countdown);
      }
      controls.querySelectorAll('[data-visual-choice]').forEach(function(link){
        var url=new URL(location.href);
        url.searchParams.set('visual',link.dataset.visualChoice);
        link.href=url.href;
        if(link.dataset.visualChoice===value)link.setAttribute('aria-current','page');
        else link.removeAttribute('aria-current');
      });
      watchNavigation();
    }
    controls.addEventListener('click',function(event){
      var link=event.target.closest('[data-visual-choice]');
      if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
      event.preventDefault();
      history.replaceState(null,'',link.href);
      render(link.dataset.visualChoice);
    });
    render(selected);
    window.matchMedia('(max-width:760px)').addEventListener('change',watchNavigation);
  });
})();
