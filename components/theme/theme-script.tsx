import {
  DARK_THEME_VARS,
  LIGHT_THEME_VARS,
  LS_APPEARANCE,
  LS_THEME,
  THEMED_ROUTE_PREFIXES,
} from "@/lib/theme-vars";

// Blocking inline script, rendered in the root <head>, that applies `.dark`
// and the preset's color vars to <html> before first paint — resolved like
// theme-provider.tsx (localStorage → server setting → OS preference for
// "auto"). Only on agent/admin routes; everything else stays light.
//
// A plain <script>, not next/script beforeInteractive: the latter is emitted
// as `self.__next_s.push(...)` and only runs once Next's client runtime has
// loaded, i.e. after the page has already painted light. The root layout
// never remounts, so React never creates this element client-side (where
// scripts don't execute and React warns) — it only ever hydrates it.
export function ThemeScript({
  appearanceMode,
  theme,
}: {
  appearanceMode: string;
  theme: string;
}) {
  const config = JSON.stringify({
    appearance: appearanceMode,
    dark: DARK_THEME_VARS,
    light: LIGHT_THEME_VARS,
    lsAppearance: LS_APPEARANCE,
    lsTheme: LS_THEME,
    prefixes: THEMED_ROUTE_PREFIXES,
    theme,
  }).replace(/</g, "\\u003c");

  const js = `(function(){try{var c=${config};var p=location.pathname;if(!c.prefixes.some(function(x){return p===x||p.indexOf(x+'/')===0;}))return;var a=localStorage.getItem(c.lsAppearance)||c.appearance;var t=localStorage.getItem(c.lsTheme)||c.theme;var d=a==='dark'||(a==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList[d?'add':'remove']('dark');var m=d?c.dark:c.light;var v=m[t]||m['default'];for(var k in v)r.style.setProperty(k,v[k]);}catch(e){}})();`;

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: static, non-user script run before paint to prevent theme flash
    <script dangerouslySetInnerHTML={{ __html: js }} id="theme-script" />
  );
}
