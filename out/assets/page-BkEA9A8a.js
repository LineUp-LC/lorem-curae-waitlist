import{r as l,j as e,a as N,L as x}from"./index-_tKk-o8C.js";import{S as v}from"./SupabaseWaitlistForm-Do0hKs0u.js";import{s as p}from"./supabase-CFcKYdot.js";function k(){const[r,i]=l.useState(null),[s,o]=l.useState(null);return l.useEffect(()=>{p.auth.getUser().then(({data:a})=>{i(a.user)})},[]),l.useEffect(()=>{r&&p.from("waitlist").select("*").eq("email",r.email).single().then(({data:a})=>o(a))},[r]),r?!s||s.wave_number===null?e.jsx("p",{children:"You’re currently waiting to be assigned to a wave."}):s.status==="waiting"?e.jsxs("p",{children:["You're in Wave ",s.wave_number,". We'll notify you when your wave opens."]}):s.status==="invited"?e.jsx("p",{children:"Your wave is open. Check your email for access."}):s.status==="active"?e.jsx("p",{children:"You’re in! Your account is active."}):null:e.jsx("p",{children:"You're on the waitlist. We release access in waves."})}function F(){console.log("MagicLinkLogin component rendered"),console.log("ENV_SUPABASE_URL:",`https://fskvzrobcfokezumadbb.supabase.co
`),console.log("ENV_SUPABASE_ANON_KEY:",`sb_publishable_3UZruL11itXxCe3ygMywgw_D29NeQ9N
`.slice(0,6)+"...(masked)");const[r,i]=l.useState({email:"",status:"idle",errorMessage:""}),{email:s,status:o,errorMessage:a}=r,c=o==="loading",d=h=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h),m=h=>{i(t=>({...t,email:h.target.value,errorMessage:"",status:t.status==="error"||t.status==="not-on-waitlist"?"idle":t.status}))},g=async h=>{h.preventDefault();const t=s.trim().toLowerCase();if(console.log("trimmedEmail:",t,JSON.stringify(t)),!t){i(n=>({...n,errorMessage:"Please enter your email address."}));return}if(!d(t)){i(n=>({...n,errorMessage:"Please enter a valid email address."}));return}i(n=>({...n,status:"loading",errorMessage:""}));try{const{data:n,error:u}=await p.from("waitlist").select("id").eq("email",t).maybeSingle();if(console.log("waitlistEntry:",n),console.log("lookupError:",u),u)throw u;if(!n){i(y=>({...y,status:"not-on-waitlist",errorMessage:""}));return}console.log("[MagicLinkLogin] Sending request to /api/request-magic-link"),console.log("[MagicLinkLogin] Request body:",JSON.stringify({email:t,type:"login"}));const b=await fetch("/api/request-magic-link",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t,type:"login"})});console.log("[MagicLinkLogin] Response status:",b.status);let f;try{f=await b.json(),console.log("[MagicLinkLogin] Response body:",JSON.stringify(f))}catch{console.error("[MagicLinkLogin] Failed to parse response as JSON"),f={}}if(!b.ok)throw new Error(f.error||"Failed to send magic link");console.log("[MagicLinkLogin] Magic link email sent successfully"),i(y=>({...y,status:"success",email:""}))}catch(n){console.error("Magic link error:",n),i(u=>({...u,status:"error",errorMessage:"Something went wrong. Please try again."}))}},j=()=>{i({email:"",status:"idle",errorMessage:""})};return o==="success"?e.jsxs("div",{className:"max-w-xl mx-auto mt-6 text-center animate-fade-in",children:[e.jsx("div",{className:"mx-auto w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center mb-4",children:e.jsx("svg",{className:"w-7 h-7 text-sage-600",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"})})}),e.jsx("p",{className:"text-sage-700 text-lg font-medium mb-2",children:"Check your email. Your magic link is on the way."}),e.jsx("p",{className:"text-sage-500 text-sm",children:"Click the link in your email to sign in securely."})]}):o==="not-on-waitlist"?e.jsxs("div",{className:"max-w-xl mx-auto mt-6 text-center animate-fade-in",children:[e.jsx("div",{className:"mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4",children:e.jsx("svg",{className:"w-7 h-7 text-amber-500",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"})})}),e.jsx("p",{className:"text-sage-700 text-lg font-medium mb-2",children:"This email isn't on the waitlist yet. Want to join?"}),e.jsx("p",{className:"text-sage-500 text-sm mb-4",children:"Sign up above to get early access to Curae."}),e.jsx("button",{onClick:j,className:"text-sage-600 text-sm font-medium hover:text-sage-700 underline underline-offset-2 transition-colors",children:"Try a different email"})]}):e.jsxs("form",{onSubmit:g,className:"max-w-xl mx-auto mt-6",noValidate:!0,children:[e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"email",id:"magicLinkEmail",name:"magicLinkEmail",autoComplete:"email",required:!0,placeholder:"Your email address",value:s,onChange:m,disabled:c,"aria-label":"Email address for magic link","aria-invalid":!!a,"aria-describedby":a?"magic-link-error":void 0,className:`
              w-full px-6 py-4 border-2 rounded-full
              text-sage-800 placeholder-sage-400
              transition-all duration-300 ease-out
              focus:outline-none focus:ring-2 focus:ring-sage-500/30
              disabled:opacity-60 disabled:cursor-not-allowed
              ${a?"border-coral-400 focus:border-coral-500 focus:ring-coral-500/30":"border-slate-200 hover:border-sage-300 focus:border-sage-500"}
            `}),c&&e.jsx("div",{className:"absolute right-5 top-1/2 -translate-y-1/2",children:e.jsx("div",{className:"h-5 w-5 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin"})})]}),a&&e.jsx("p",{id:"magic-link-error",role:"alert",className:"text-coral-600 text-sm pl-6 animate-slide-up",children:a}),e.jsx("button",{type:"submit",disabled:c,className:`
            w-full px-8 py-4 bg-slate-900 text-white rounded-full
            text-lg font-medium
            transition-all duration-300 ease-out
            hover:bg-slate-800 hover:shadow-lg
            focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
            active:scale-[0.98]
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none
          `,children:c?"Sending link...":"Sign in with magic link"}),e.jsx("p",{className:"text-center text-sage-500 text-sm font-light px-4",children:"A magic link is a secure one‑time login sent to your email. Click it to confirm your identity and access your account."})]}),e.jsx("div",{className:"mt-6 pt-4 border-t border-slate-200/60 text-center",children:e.jsxs("p",{className:"text-sage-600 text-sm",children:["Not on the waitlist yet?"," ",e.jsx("a",{href:"#waitlist",className:"font-medium text-sage-700 hover:text-sage-800 underline underline-offset-2 transition-colors",onClick:h=>{h.preventDefault(),document.getElementById("waitlist")?.scrollIntoView({behavior:"smooth"})},children:"Join now"})]})})]})}function C(){const r=N();return l.useEffect(()=>{(async()=>{const{data:{session:s}}=await p.auth.getSession();if(!s?.user?.email)return;const o=s.user.email.trim().toLowerCase(),{data:a}=await p.from("waitlist").select("wants_tester_access").eq("email",o).maybeSingle();a?.wants_tester_access?window.location.href="https://tester-access-page.vercel.app":r("/waitlist")})()},[r]),null}const S=[{name:"Yuka",isUs:!1,bullets:["Universal score. Same verdict for every user.","No skin-type awareness, no concern-aware ratings."]},{name:"Think Dirty",isUs:!1,bullets:["Barcode-based, not camera-first.","Hazard ratings are static, not contextual to your skin."]},{name:"INCI Decoder",isUs:!1,bullets:["Deep ingredient data, zero personalization.","You're left to interpret what any of it means for you."]},{name:"EWG Skin Deep",isUs:!1,bullets:["Database-first, not scan-first.","Hazard scores don't change with your profile or concerns."]},{name:"Curae",isUs:!0,bullets:["Camera scan identifies any product in seconds.","Every verdict is scored against your specific skin profile.","Deterministic rules: EU Annex II, formaldehyde releasers, MI/MCI, heavy metals.","Unknown products auto-catalog for the next person who scans them."]}],w=r=>i=>{i.preventDefault(),document.getElementById(r)?.scrollIntoView({behavior:"smooth",block:"start"})},M=()=>{const[r,i]=l.useState(null),[s,o]=l.useState(!0);return l.useEffect(()=>{p.from("founding_member_slots").select("*").single().then(({data:a})=>{a&&i(a),o(!1)})},[]),l.useEffect(()=>{const a=document.querySelectorAll(".lc-reveal");if(a.length===0)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){a.forEach(m=>m.classList.add("is-visible"));return}const d=new IntersectionObserver(m=>{m.forEach(g=>{g.isIntersecting&&(g.target.classList.add("is-visible"),d.unobserve(g.target))})},{threshold:.15,rootMargin:"0px 0px -40px 0px"});return a.forEach(m=>d.observe(m)),()=>d.disconnect()},[]),e.jsxs("div",{className:"lc-waitlist-page",children:[e.jsx(C,{}),e.jsx("style",{children:`
        .lc-waitlist-page {
          min-height: 100vh;
          background: #FAF8F5;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1a1a1a;
          -webkit-font-smoothing: antialiased;
        }

        /* ============================================================
           HEADER (floating over dark hero, translucent dark)
           ============================================================ */
        .lc-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(15, 15, 15, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          z-index: 50;
        }

        .lc-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .lc-logo {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #FAF8F5;
          text-decoration: none;
          letter-spacing: -0.01em;
        }

        .lc-header-cta {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.625rem 1.25rem;
          background: #C4704D;
          color: #FFFFFF;
          border-radius: 100px;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .lc-header-cta:hover {
          background: #A85C3C;
          transform: translateY(-1px);
        }



        /* ============================================================
           HERO (dark, left-aligned, grain overlay, staggered entrance)
           ============================================================ */
        .lc-hero {
          padding: 6rem 1.5rem 5.5rem;
          margin-top: 112px;
          background: #0f0f0f;
          position: relative;
          overflow: hidden;
        }

        /* Terracotta ambient light, top-right */
        .lc-hero::before {
          content: '';
          position: absolute;
          top: -25%;
          right: -15%;
          width: 620px;
          height: 620px;
          background: radial-gradient(circle, rgba(196, 112, 77, 0.14) 0%, transparent 68%);
          pointer-events: none;
          z-index: 0;
        }

        /* Cool counter-light, bottom-left */
        .lc-hero::after {
          content: '';
          position: absolute;
          bottom: -35%;
          left: -20%;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(93, 202, 165, 0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Static grain noise overlay (pre-rendered SVG, no filter computations) */
        .lc-grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.045;
          mix-blend-mode: overlay;
          pointer-events: none;
          z-index: 1;
        }

        .lc-hero-content {
          position: relative;
          z-index: 2;
          max-width: 940px;
          margin: 0 auto;
          text-align: left;
        }

        .lc-hero-headline-wrap {
          max-width: 820px;
        }

        .lc-hero-sub-wrap {
          max-width: 620px;
        }

        .lc-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C4704D;
          background: rgba(196, 112, 77, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 100px;
          margin-bottom: 2rem;
          display: inline-block;
          border: 1px solid rgba(196, 112, 77, 0.2);
        }

        .lc-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2.25rem, 5.8vw, 4.5rem);
          font-weight: 500;
          line-height: 1.08;
          margin: 0 0 1.5rem;
          letter-spacing: -0.015em;
          color: #FAF8F5;
        }

        .lc-headline em {
          font-style: italic;
          color: #E8A888;
        }

        .lc-subhead {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(1rem, 1.6vw, 1.125rem);
          color: rgba(250, 248, 245, 0.72);
          margin: 0 0 2.5rem;
          line-height: 1.65;
        }

        .lc-cta-group {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0.75rem;
        }

        @media (min-width: 640px) {
          .lc-cta-group {
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
          }
        }

        /* Hero staggered entrance — auto-plays on mount.
           Each child waits on --i (index) * 120ms. */
        .lc-hero-stagger > * {
          opacity: 0;
          transform: translateY(12px);
          animation: lcFadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: calc(var(--i, 0) * 120ms + 80ms);
        }

        @keyframes lcFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .lc-hero-stagger > * {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }

        /* Legacy .lc-cta-group (non-hero) keeps centered layout */
        .lc-cta-group-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .lc-btn-primary {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.95rem 1.75rem;
          background: #C4704D;
          color: #FFFFFF;
          border: none;
          border-radius: 100px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
          text-align: center;
        }

        @media (min-width: 640px) {
          .lc-btn-primary {
            width: auto;
          }
        }

        .lc-btn-primary:hover {
          background: #A85C3C;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(196, 112, 77, 0.25);
        }

        /* Tactile push — overrides hover translate on click */
        .lc-btn-primary:active {
          transform: scale(0.98) translateY(0);
          transition: transform 100ms ease-out;
          box-shadow: 0 4px 12px rgba(196, 112, 77, 0.2);
        }

        .lc-btn-ghost-dark {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.95rem 1.75rem;
          background: transparent;
          color: #FAF8F5;
          border: 1px solid rgba(250, 248, 245, 0.25);
          border-radius: 100px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s ease;
          width: 100%;
          text-align: center;
        }

        @media (min-width: 640px) {
          .lc-btn-ghost-dark {
            width: auto;
          }
        }

        .lc-btn-ghost-dark:hover {
          border-color: #E8A888;
          color: #E8A888;
        }

        .lc-btn-ghost-dark:active {
          transform: scale(0.98);
          transition: transform 100ms ease-out;
        }

        /* ============================================================
           SCROLL REVEAL (IntersectionObserver adds .is-visible)
           Transform + opacity only. Stagger via --i CSS variable.
           ============================================================ */
        .lc-reveal {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 700ms cubic-bezier(0.16, 1, 0.3, 1),
                      transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: calc(var(--i, 0) * 80ms);
          will-change: transform, opacity;
        }

        .lc-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .lc-reveal { opacity: 1; transform: none; transition: none; }
        }

        /* ============================================================
           SHARED SECTION PRIMITIVES
           ============================================================ */
        .lc-section {
          padding: 5rem 1.5rem;
        }

        @media (min-width: 768px) {
          .lc-section {
            padding: 6rem 2rem;
          }
        }

        .lc-section-cream { background: #FAF8F5; }
        .lc-section-white { background: #FFFFFF; }
        .lc-section-dark  { background: #0f0f0f; color: #FAF8F5; }

        .lc-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .lc-container-narrow {
          max-width: 780px;
          margin: 0 auto;
        }

        .lc-section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C4704D;
          margin: 0 0 1rem;
          display: block;
        }

        .lc-section-label-dark { color: #E8A888; }

        .lc-section-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(1.875rem, 4vw, 2.75rem);
          font-weight: 500;
          line-height: 1.15;
          letter-spacing: -0.01em;
          margin: 0 0 1.25rem;
          color: #1a1a1a;
        }

        .lc-section-title-dark { color: #FAF8F5; }

        .lc-section-title em {
          font-style: italic;
          color: #C4704D;
        }

        .lc-section-title-dark em {
          color: #E8A888;
        }

        .lc-section-lead {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.0625rem;
          color: #5a5149;
          line-height: 1.7;
          margin: 0 0 2rem;
        }

        .lc-section-lead-dark { color: rgba(250, 248, 245, 0.68); }

        .lc-section-intro {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 3.5rem;
        }

        /* ============================================================
           PROBLEM SECTION
           ============================================================ */
        .lc-problem-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(1.75rem, 3.5vw, 2.5rem);
          font-weight: 500;
          line-height: 1.2;
          color: #1a1a1a;
          margin: 0 0 1.5rem;
          letter-spacing: -0.01em;
        }

        .lc-problem-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.0625rem;
          color: #5a5149;
          line-height: 1.75;
          margin: 0;
        }

        .lc-problem-body strong {
          color: #1a1a1a;
          font-weight: 600;
        }

        .lc-problem-body em {
          font-style: italic;
          color: #C4704D;
          font-weight: 500;
        }

        /* ============================================================
           HOW IT WORKS — 3 steps (Scan → Analyze → Know)
           ============================================================ */
        .lc-steps-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .lc-steps-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
        }

        .lc-step-card {
          background: #FFFFFF;
          padding: 2rem 1.75rem;
          border-radius: 18px;
          border: 1px solid rgba(26, 26, 26, 0.06);
          position: relative;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .lc-step-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 50px rgba(26, 26, 26, 0.06);
          border-color: rgba(196, 112, 77, 0.2);
        }

        .lc-step-num {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: #C4704D;
          margin-bottom: 1rem;
          display: block;
        }

        .lc-step-icon {
          width: 48px;
          height: 48px;
          background: rgba(196, 112, 77, 0.08);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C4704D;
          font-size: 1.5rem;
          margin-bottom: 1.25rem;
        }

        .lc-step-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: #1a1a1a;
          letter-spacing: -0.005em;
        }

        .lc-step-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          color: #5a5149;
          line-height: 1.6;
          margin: 0;
        }

        /* ============================================================
           SAFETY TIER VISUALIZATION (the core differentiator)
           ============================================================ */
        .lc-tiers {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          max-width: 720px;
          margin: 0 auto;
        }

        .lc-tier-row {
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid rgba(26, 26, 26, 0.06);
          padding: 1.25rem 1.5rem 1.25rem 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .lc-tier-row:hover {
          transform: translateX(2px);
          box-shadow: 0 10px 30px rgba(26, 26, 26, 0.05);
        }

        .lc-tier-row::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          transform: scaleX(1);
          transform-origin: left center;
          will-change: transform;
        }

        .lc-tier-row.safe::before    { background: #5DCAA5; }
        .lc-tier-row.caution::before { background: #EF9F27; }
        .lc-tier-row.avoid::before   { background: #E24B4A; }

        .lc-tier-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 0.5rem;
          flex-shrink: 0;
        }

        .lc-tier-dot.safe    { background: #5DCAA5; box-shadow: 0 0 0 4px rgba(93, 202, 165, 0.15); }
        .lc-tier-dot.caution { background: #EF9F27; box-shadow: 0 0 0 4px rgba(239, 159, 39, 0.15); }
        .lc-tier-dot.avoid   { background: #E24B4A; box-shadow: 0 0 0 4px rgba(226, 75, 74, 0.15); }

        .lc-tier-body { flex: 1; min-width: 0; }

        .lc-tier-heading {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.375rem;
        }

        .lc-tier-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .lc-tier-label.safe    { color: #3B8F73; }
        .lc-tier-label.caution { color: #B87615; }
        .lc-tier-label.avoid   { color: #B43836; }

        .lc-tier-verdict {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1a1a;
          letter-spacing: -0.005em;
        }

        .lc-tier-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: #5a5149;
          line-height: 1.55;
          margin: 0;
        }

        /* ============================================================
           FEATURES GRID
           ============================================================ */
        .lc-features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .lc-features-grid {
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
          }
        }

        .lc-feature-card {
          background: #FFFFFF;
          padding: 1.75rem;
          border-radius: 16px;
          border: 1px solid rgba(26, 26, 26, 0.06);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .lc-feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 45px rgba(26, 26, 26, 0.06);
          border-color: rgba(196, 112, 77, 0.18);
        }

        /* Asymmetric offset on desktop to break the 2-col grid grid.
           Combines with .lc-reveal's transition transform — uses a
           container translateY via margin-top so it doesn't conflict. */
        @media (min-width: 768px) {
          .lc-feature-offset { margin-top: 2rem; }
        }

        .lc-feature-icon {
          width: 40px;
          height: 40px;
          background: rgba(196, 112, 77, 0.08);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C4704D;
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        .lc-feature-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.375rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: #1a1a1a;
          letter-spacing: -0.005em;
        }

        .lc-feature-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          color: #5a5149;
          line-height: 1.6;
          margin: 0;
        }

        /* ============================================================
           DIFFERENTIATION (dark)
           ============================================================ */
        .lc-diff-section {
          position: relative;
          overflow: hidden;
        }

        .lc-diff-intro {
          position: relative;
          padding-top: 0.5rem;
        }

        .lc-diff-numeral {
          position: absolute;
          top: -2.5rem;
          left: -0.25rem;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-weight: 500;
          font-size: 7rem;
          line-height: 1;
          color: rgba(232, 168, 136, 0.14);
          letter-spacing: -0.03em;
          pointer-events: none;
          user-select: none;
        }

        @media (min-width: 900px) {
          .lc-diff-numeral {
            font-size: 9rem;
            top: -3.25rem;
          }
        }

        .lc-diff-headline {
          font-size: clamp(2rem, 4.2vw, 3.25rem) !important;
          line-height: 1.08 !important;
        }

        .lc-diff-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          align-items: start;
        }

        @media (min-width: 900px) {
          .lc-diff-grid {
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
          }
        }

        .lc-comparison-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .lc-comparison-item {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          padding: 1.125rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
        }

        .lc-comparison-item:last-child { border-bottom: none; }

        .lc-comparison-item strong {
          color: #FAF8F5;
          font-weight: 600;
          display: block;
          margin-bottom: 0.25rem;
        }

        .lc-comparison-item .bullets {
          color: rgba(250, 248, 245, 0.55);
          font-size: 0.875rem;
          line-height: 1.55;
        }

        .lc-comparison-item.lc-us .bullets {
          color: rgba(250, 248, 245, 0.82);
        }

        .lc-comparison-item .bullets > div {
          margin-bottom: 0.25rem;
        }

        .lc-icon-x {
          color: rgba(250, 248, 245, 0.28);
          font-size: 1.125rem;
          line-height: 1.4;
          flex-shrink: 0;
          width: 20px;
          text-align: center;
        }

        .lc-icon-check {
          color: #E8A888;
          font-size: 1.125rem;
          line-height: 1.4;
          flex-shrink: 0;
          width: 20px;
          text-align: center;
        }

        /* ============================================================
           FOUNDING MEMBER / WAVES
           ============================================================ */
        .lc-founding-head {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 2.5rem;
        }

        .lc-price-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          max-width: 720px;
          margin: 0 auto;
        }

        @media (min-width: 640px) {
          .lc-price-row {
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
          }
        }

        .lc-price-card {
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 26, 0.06);
          border-radius: 16px;
          padding: 1.75rem 1.5rem;
          text-align: left;
          position: relative;
        }

        .lc-price-card-accent {
          border-color: rgba(196, 112, 77, 0.28);
          box-shadow: 0 14px 40px rgba(196, 112, 77, 0.08);
        }

        .lc-price-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8b7f74;
          margin-bottom: 0.875rem;
        }

        .lc-price-amount {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .lc-price-currency {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 500;
          color: #C4704D;
        }

        .lc-price-num {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 2.875rem;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .lc-price-period {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: #5a5149;
          margin-left: 0.25rem;
        }

        .lc-price-note {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8125rem;
          color: #5a5149;
        }

        .lc-slot-badge {
          display: inline-block;
          padding: 0.375rem 1rem;
          border-radius: 9999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .lc-slot-badge-active {
          background: rgba(122, 111, 94, 0.1);
          color: #7a6f5e;
        }
        .lc-slot-badge-closed {
          background: #f0ece8;
          color: #9a9490;
        }
        .lc-slot-badge-skeleton {
          background: #f0ece8;
          color: transparent;
          min-width: 260px;
          animation: lc-pulse 1.5s ease-in-out infinite;
        }
        @keyframes lc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .lc-price-row-muted {
          opacity: 0.45;
          pointer-events: none;
          filter: grayscale(0.4);
        }

        /* ============================================================
           PERKS
           ============================================================ */
        .lc-perks-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.875rem;
        }

        @media (min-width: 640px) {
          .lc-perks-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (min-width: 900px) {
          .lc-perks-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .lc-perk {
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 26, 0.06);
          border-radius: 14px;
          padding: 1.5rem 1.25rem;
        }

        .lc-perk-icon {
          width: 36px;
          height: 36px;
          background: rgba(196, 112, 77, 0.08);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C4704D;
          font-size: 1.125rem;
          margin-bottom: 0.875rem;
        }

        .lc-perk-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.1875rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 0.375rem;
          letter-spacing: -0.005em;
        }

        .lc-perk-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8125rem;
          color: #5a5149;
          line-height: 1.55;
          margin: 0;
        }

        /* ============================================================
           FINAL CTA + FORM
           ============================================================ */
        .lc-final-cta {
          padding: 5rem 1.5rem 6rem;
          background: #FAF8F5;
        }

        .lc-cta-card {
          max-width: 640px;
          margin: 0 auto;
          padding: 2.5rem 1.75rem;
          background: #FFFFFF;
          border-radius: 22px;
          border: 1px solid rgba(26, 26, 26, 0.06);
          box-shadow: 0 25px 70px rgba(26, 26, 26, 0.06);
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .lc-cta-card { padding: 3.25rem 3rem; }
        }

        .lc-cta-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #5DCAA5 0%, #EF9F27 50%, #E24B4A 100%);
        }

        .lc-cta-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(1.75rem, 3vw, 2.25rem);
          font-weight: 500;
          margin: 0 0 0.75rem;
          color: #1a1a1a;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .lc-cta-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          color: #5a5149;
          line-height: 1.65;
          margin: 0 0 2rem;
        }

        .lc-form-wrapper { max-width: 460px; margin: 0 auto; }

        .lc-status-wrapper {
          margin-top: 1.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: #8b7f74;
          text-align: center;
        }

        .lc-magic-link-section {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(26, 26, 26, 0.08);
        }

        .lc-magic-link-section h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.375rem;
          font-weight: 600;
          margin: 0 0 0.75rem;
          color: #1a1a1a;
          letter-spacing: -0.005em;
        }

        /* ----------- Scoped brand overrides on embedded forms -----------
           SupabaseWaitlistForm & MagicLinkLogin use hardcoded sage/slate
           Tailwind colors internally. Override primary buttons + input
           focus to match terracotta brand. Limited to .lc-form-wrapper
           and .lc-magic-link-section scope, so no global side effects. */
        .lc-form-wrapper button[type="submit"],
        .lc-magic-link-section button[type="submit"] {
          background: #C4704D !important;
          color: #FFFFFF !important;
          font-family: 'DM Sans', sans-serif !important;
          font-weight: 600 !important;
        }

        .lc-form-wrapper button[type="submit"]:hover:not(:disabled),
        .lc-magic-link-section button[type="submit"]:hover:not(:disabled) {
          background: #A85C3C !important;
          box-shadow: 0 10px 30px rgba(196, 112, 77, 0.22) !important;
        }

        .lc-form-wrapper input[type="email"]:focus,
        .lc-magic-link-section input[type="email"]:focus {
          border-color: #C4704D !important;
          box-shadow: 0 0 0 3px rgba(196, 112, 77, 0.15) !important;
        }

        .lc-form-wrapper input[type="checkbox"] {
          accent-color: #C4704D !important;
        }

        /* Hide the heading SupabaseWaitlistForm renders internally — the
           CTA card already provides a heading and duplicating it reads
           as bloat. */
        .lc-form-wrapper form > div.text-center:first-child {
          display: none;
        }

        /* ============================================================
           FOOTER
           ============================================================ */
        .lc-footer {
          padding: 3rem 1.5rem 2.5rem;
          background: #0f0f0f;
          color: #FAF8F5;
          text-align: center;
        }

        .lc-footer-logo {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.625rem;
          font-weight: 600;
          color: #FAF8F5;
          text-decoration: none;
          display: inline-block;
          margin-bottom: 0.375rem;
          letter-spacing: -0.01em;
        }

        .lc-footer-tagline {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: rgba(250, 248, 245, 0.55);
          margin: 0 0 1.5rem;
        }

        .lc-footer-links {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8125rem;
          color: rgba(250, 248, 245, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .lc-footer-links a {
          color: rgba(250, 248, 245, 0.55);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .lc-footer-links a:hover { color: #E8A888; }

        .lc-footer-sep {
          color: rgba(250, 248, 245, 0.2);
        }

        .lc-footer-copy {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          color: rgba(250, 248, 245, 0.3);
          margin: 1.5rem 0 0;
        }

        /* ============================================================
           MOBILE FINE-TUNING (375px target)
           ============================================================ */
        @media (max-width: 480px) {
          .lc-hero { padding: 4.5rem 1.25rem 4.5rem; margin-top: 108px; }
          .lc-section { padding: 4rem 1.25rem; }
          .lc-cta-card { padding: 2.25rem 1.5rem; }
          .lc-header-inner { padding: 0.875rem 1.25rem; }
          .lc-creator-link { font-size: 0.75rem; }
          .lc-creator-banner { padding: 0.625rem 1rem; }
        }
      `}),e.jsx("header",{className:"lc-header",children:e.jsxs("div",{className:"lc-header-inner",children:[e.jsx(x,{to:"/",className:"lc-logo",children:e.jsx("img",{src:"/curae-logo.png",alt:"Curae",style:{height:"80px",width:"auto"}})}),e.jsx("a",{href:"#waitlist",onClick:w("waitlist"),className:"lc-header-cta",children:"Join waitlist"})]})}),e.jsxs("section",{className:"lc-hero",children:[e.jsx("div",{className:"lc-grain","aria-hidden":"true"}),e.jsxs("div",{className:"lc-hero-content lc-hero-stagger",children:[e.jsx("div",{className:"lc-eyebrow",style:{"--i":0},children:"Now accepting founding members"}),e.jsx("div",{className:"lc-hero-headline-wrap",style:{"--i":1},children:e.jsx("h1",{className:"lc-headline",children:"The layer of intelligence between you and every skincare product you'll ever buy."})}),e.jsx("div",{className:"lc-hero-sub-wrap",style:{"--i":2},children:e.jsx("p",{className:"lc-subhead",children:"Point your camera at any product. Curae breaks down every ingredient, flags your allergens, checks it against your routine, and tells you honestly whether it belongs on your shelf."})}),e.jsxs("div",{className:"lc-cta-group",style:{"--i":3},children:[e.jsx("a",{href:"#waitlist",onClick:w("waitlist"),className:"lc-btn-primary",children:"Join the waitlist"}),e.jsx("a",{href:"#how",onClick:w("how"),className:"lc-btn-ghost-dark",children:"See how it works"})]})]})]}),e.jsx("section",{className:"lc-section lc-section-cream",children:e.jsxs("div",{className:"lc-container-narrow",style:{textAlign:"center"},children:[e.jsx("span",{className:"lc-section-label",children:"The problem"}),e.jsx("h2",{className:"lc-problem-title",children:"Skincare research shouldn't take 30 minutes per product."}),e.jsxs("p",{className:"lc-problem-body",children:["You're on ",e.jsx("strong",{children:"Reddit"})," comparing ingredient lists. You're scrolling",e.jsx("strong",{children:" Sephora"})," reviews from people with different skin than yours. You're watching ",e.jsx("strong",{children:"TikToks"})," where one person calls a product holy grail and the next says it ruined them. The information is everywhere. None of it is about ",e.jsx("em",{children:"your"})," skin. One scan changes that."]})]})}),e.jsx("section",{id:"how",className:"lc-section lc-section-white",children:e.jsxs("div",{className:"lc-container",children:[e.jsxs("div",{className:"lc-section-intro",children:[e.jsx("span",{className:"lc-section-label",children:"How it works"}),e.jsx("h2",{className:"lc-section-title",children:"Scan. Analyze. Know."}),e.jsx("p",{className:"lc-section-lead",children:"Three steps, under ten seconds, no manual product lookup."})]}),e.jsxs("div",{className:"lc-steps-grid",children:[e.jsxs("article",{className:"lc-step-card",children:[e.jsx("span",{className:"lc-step-num",children:"STEP 01"}),e.jsx("div",{className:"lc-step-icon",children:e.jsx("i",{className:"ri-camera-lens-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-step-title",children:"Scan"}),e.jsx("p",{className:"lc-step-body",children:"Point your camera at any skincare product. Curae identifies it in seconds. No barcode required. Products not yet in the database get added automatically for the next person who scans them."})]}),e.jsxs("article",{className:"lc-step-card",children:[e.jsx("span",{className:"lc-step-num",children:"STEP 02"}),e.jsx("div",{className:"lc-step-icon",children:e.jsx("i",{className:"ri-flask-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-step-title",children:"Analyze"}),e.jsx("p",{className:"lc-step-body",children:"Every ingredient is scored against your skin profile. Not a universal rating. Yours. Based on your skin type, concerns, sensitivities, and what's already in your routine."})]}),e.jsxs("article",{className:"lc-step-card",children:[e.jsx("span",{className:"lc-step-num",children:"STEP 03"}),e.jsx("div",{className:"lc-step-icon",children:e.jsx("i",{className:"ri-shield-check-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-step-title",children:"Know"}),e.jsx("p",{className:"lc-step-body",children:"Safe, Caution, or Avoid. Every ingredient. With the specific reason it landed there for your skin, not a generic hazard score."})]})]})]})}),e.jsx("section",{className:"lc-section lc-section-cream",children:e.jsxs("div",{className:"lc-container-narrow",children:[e.jsxs("div",{className:"lc-section-intro",children:[e.jsx("span",{className:"lc-section-label",children:"The tier system"}),e.jsx("h2",{className:"lc-section-title",children:"Three verdicts. No guessing."}),e.jsxs("p",{className:"lc-section-lead",children:["Every ingredient gets one of three tiers. Deterministic rules, not a black-box score. And the verdict changes based on ",e.jsx("em",{children:"your"})," skin."]})]}),e.jsxs("div",{className:"lc-tiers",children:[e.jsxs("div",{className:"lc-tier-row safe",children:[e.jsx("div",{className:"lc-tier-dot safe","aria-hidden":"true"}),e.jsxs("div",{className:"lc-tier-body",children:[e.jsxs("div",{className:"lc-tier-heading",children:[e.jsx("span",{className:"lc-tier-label safe",children:"Safe"}),e.jsx("span",{className:"lc-tier-verdict",children:"Use freely."})]}),e.jsx("p",{className:"lc-tier-text",children:"Matches your profile. No flags against EU Annex II, no known sensitizers for your concerns, no conflicts with the rest of your routine."})]})]}),e.jsxs("div",{className:"lc-tier-row caution",children:[e.jsx("div",{className:"lc-tier-dot caution","aria-hidden":"true"}),e.jsxs("div",{className:"lc-tier-body",children:[e.jsxs("div",{className:"lc-tier-heading",children:[e.jsx("span",{className:"lc-tier-label caution",children:"Caution"}),e.jsx("span",{className:"lc-tier-verdict",children:"Watch how your skin responds."})]}),e.jsx("p",{className:"lc-tier-text",children:"Known sensitizers, AHAs/BHAs, retinol, sulfates, comedogenics. Usable for many, but patch test first and introduce slowly if your skin is reactive."})]})]}),e.jsxs("div",{className:"lc-tier-row avoid",children:[e.jsx("div",{className:"lc-tier-dot avoid","aria-hidden":"true"}),e.jsxs("div",{className:"lc-tier-body",children:[e.jsxs("div",{className:"lc-tier-heading",children:[e.jsx("span",{className:"lc-tier-label avoid",children:"Avoid"}),e.jsx("span",{className:"lc-tier-verdict",children:"Don't put this on your skin."})]}),e.jsx("p",{className:"lc-tier-text",children:"EU-banned substances, formaldehyde releasers, MI/MCI, heavy metals. These don't clear the bar for safe topical use."})]})]})]})]})}),e.jsx("section",{className:"lc-section lc-section-white",children:e.jsxs("div",{className:"lc-container",children:[e.jsxs("div",{className:"lc-section-intro",children:[e.jsx("span",{className:"lc-section-label",children:"Core features"}),e.jsx("h2",{className:"lc-section-title",children:"What a scan unlocks"}),e.jsx("p",{className:"lc-section-lead",children:"Every scan opens a complete intelligence layer, not just an ingredient list."})]}),e.jsxs("div",{className:"lc-features-grid",children:[e.jsxs("article",{className:"lc-feature-card",children:[e.jsx("div",{className:"lc-feature-icon",children:e.jsx("i",{className:"ri-store-2-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-feature-title",children:"Where to buy"}),e.jsx("p",{className:"lc-feature-text",children:"Every scan surfaces where to buy, filtered by price, retailer trust score, and shipping speed. Ranked using your scan history, budget, and onboarding data. Not a generic search result."})]}),e.jsxs("article",{className:"lc-feature-card lc-feature-offset",children:[e.jsx("div",{className:"lc-feature-icon",children:e.jsx("i",{className:"ri-exchange-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-feature-title",children:"Compatible and similar products"}),e.jsx("p",{className:"lc-feature-text",children:"Scan anything and instantly see what works alongside it in your routine and what alternatives exist at different price points. Matched to your skin profile, not a universal compatibility list."})]}),e.jsxs("article",{className:"lc-feature-card",children:[e.jsx("div",{className:"lc-feature-icon",children:e.jsx("i",{className:"ri-stack-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-feature-title",children:"Your shelf"}),e.jsx("p",{className:"lc-feature-text",children:"Every product you scan gets added to your digital shelf, a live view of your full routine. Ask Curae AI about anything on it, build routines from products you actually own, and get automatic check-ins once a product has been in your routine long enough to show results."})]}),e.jsxs("article",{className:"lc-feature-card lc-feature-offset",children:[e.jsx("div",{className:"lc-feature-icon",children:e.jsx("i",{className:"ri-sparkling-2-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-feature-title",children:"Curae AI"}),e.jsx("p",{className:"lc-feature-text",children:"Not a chatbot. A skincare companion that already knows your skin. Curae AI comes in already knowing your skin type, concerns, current routine, and scan history. Ask it anything: 'I'm going to Miami this weekend, is my SPF enough for that humidity?' or 'My skin has been breaking out since I added this serum, what's the likely culprit?' It pulls from your scan results, your profile, real-time environment data, and ingredient research. An answer that's actually about your skin."})]})]})]})}),e.jsx("section",{className:"lc-section lc-section-white",children:e.jsxs("div",{className:"lc-container",children:[e.jsxs("div",{className:"lc-section-intro",children:[e.jsx("span",{className:"lc-section-label",children:"What's shipping"}),e.jsx("h2",{className:"lc-section-title",children:"Built for people who read ingredient lists."}),e.jsx("p",{className:"lc-section-lead",children:"No wellness platitudes. Just the tools we wished existed."})]}),e.jsxs("div",{className:"lc-features-grid",children:[e.jsxs("article",{className:"lc-feature-card",children:[e.jsx("div",{className:"lc-feature-icon",children:e.jsx("i",{className:"ri-scan-2-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-feature-title",children:"Camera-first identification"}),e.jsx("p",{className:"lc-feature-text",children:"Point at any product. Curae identifies it in seconds. Unknown products auto-catalog for the next person."})]}),e.jsxs("article",{className:"lc-feature-card lc-feature-offset",children:[e.jsx("div",{className:"lc-feature-icon",children:e.jsx("i",{className:"ri-user-heart-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-feature-title",children:"Skin-profile-aware ratings"}),e.jsx("p",{className:"lc-feature-text",children:"Same ingredient, different verdict depending on your skin. Not a universal score. Yours."})]}),e.jsxs("article",{className:"lc-feature-card",children:[e.jsx("div",{className:"lc-feature-icon",children:e.jsx("i",{className:"ri-book-2-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-feature-title",children:"Deterministic safety rules"}),e.jsx("p",{className:"lc-feature-text",children:"No opaque AI verdicts. Every call traces back to a specific rule: EU Annex II, formaldehyde releasers, MI/MCI, heavy metals, documented sensitizers. Auditable."})]}),e.jsxs("article",{className:"lc-feature-card lc-feature-offset",children:[e.jsx("div",{className:"lc-feature-icon",children:e.jsx("i",{className:"ri-pulse-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-feature-title",children:"Behavioral personalization"}),e.jsx("p",{className:"lc-feature-text",children:"Curae learns from every scan, tap, and save. Gets sharper about what you care about without asking you to fill in a survey."})]})]})]})}),e.jsxs("section",{className:"lc-section lc-section-dark lc-diff-section",children:[e.jsx("div",{className:"lc-grain","aria-hidden":"true"}),e.jsx("div",{className:"lc-container",style:{position:"relative",zIndex:2},children:e.jsxs("div",{className:"lc-diff-grid",children:[e.jsxs("div",{className:"lc-diff-intro",children:[e.jsx("span",{className:"lc-diff-numeral","aria-hidden":"true",children:"01"}),e.jsx("span",{className:"lc-section-label lc-section-label-dark",children:"Why we exist"}),e.jsxs("h2",{className:"lc-section-title lc-section-title-dark lc-diff-headline",children:["Scanning ingredients isn't new. Scanning them ",e.jsx("em",{children:"for your skin"})," is."]}),e.jsx("p",{className:"lc-section-lead lc-section-lead-dark",children:"Every other tool hands everyone the same verdict. Yuka, Think Dirty, INCI Decoder, EWG: same score, every user. We don't. Your skin type, concerns, and sensitivities change the answer. Every scan."})]}),e.jsx("ul",{className:"lc-comparison-list",children:S.map(a=>e.jsxs("li",{className:`lc-comparison-item ${a.isUs?"lc-us":""}`,children:[e.jsx("span",{className:a.isUs?"lc-icon-check":"lc-icon-x","aria-hidden":"true",children:a.isUs?"✓":"✕"}),e.jsxs("div",{children:[e.jsx("strong",{children:a.name}),e.jsx("div",{className:"bullets",children:a.bullets.map((c,d)=>e.jsx("div",{children:c},d))})]})]},a.name))})]})})]}),e.jsx("section",{className:"lc-section lc-section-cream",children:e.jsxs("div",{className:"lc-container",children:[e.jsxs("div",{className:"lc-founding-head",children:[e.jsx("span",{className:"lc-section-label",children:"Early access"}),e.jsx("h2",{className:"lc-section-title",children:"Lock your rate before launch. Keep it forever."}),e.jsx("p",{className:"lc-section-lead",style:{maxWidth:"620px",margin:"0 auto"},children:"Waitlist members get the founding rate locked to their account for life. Public pricing goes up after launch. Yours never does."})]}),e.jsx("div",{style:{textAlign:"center"},children:s?e.jsx("span",{className:"lc-slot-badge lc-slot-badge-skeleton",children:" "}):r?.slots_available?e.jsxs("span",{className:"lc-slot-badge lc-slot-badge-active",children:[r.slots_remaining," founding member spots remaining"]}):e.jsx("span",{className:"lc-slot-badge lc-slot-badge-closed",children:"Founding member pricing is now closed. Standard pricing applies at launch."})}),e.jsxs("div",{className:`lc-price-row${r&&!r.slots_available?" lc-price-row-muted":""}`,children:[e.jsxs("div",{className:"lc-price-card",children:[e.jsx("div",{className:"lc-price-label",children:"Founding rate"}),e.jsxs("div",{className:"lc-price-amount",children:[e.jsx("span",{className:"lc-price-currency",children:"$"}),e.jsx("span",{className:"lc-price-num",children:"4.99"}),e.jsx("span",{className:"lc-price-period",children:"/ month"})]}),e.jsx("div",{className:"lc-price-note",children:"Your price. Locked forever."})]}),e.jsxs("div",{className:"lc-price-card lc-price-card-accent",children:[e.jsx("div",{className:"lc-price-label",children:"Founding rate, annual"}),e.jsxs("div",{className:"lc-price-amount",children:[e.jsx("span",{className:"lc-price-currency",children:"$"}),e.jsx("span",{className:"lc-price-num",children:"34.99"}),e.jsx("span",{className:"lc-price-period",children:"/ year"})]}),e.jsx("div",{className:"lc-price-note",children:"Save ~42% vs monthly"})]})]})]})}),e.jsx("section",{className:"lc-section lc-section-white",children:e.jsxs("div",{className:"lc-container",children:[e.jsxs("div",{className:"lc-section-intro",children:[e.jsx("span",{className:"lc-section-label",children:"What you get"}),e.jsx("h2",{className:"lc-section-title",children:"Founding member perks."})]}),e.jsxs("div",{className:"lc-perks-grid",children:[e.jsxs("article",{className:"lc-perk",children:[e.jsx("div",{className:"lc-perk-icon",children:e.jsx("i",{className:"ri-price-tag-3-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-perk-title",children:"Founding rate for life"}),e.jsx("p",{className:"lc-perk-text",children:"Your subscription price never increases. Public pricing changes don't touch your account."})]}),e.jsxs("article",{className:"lc-perk",children:[e.jsx("div",{className:"lc-perk-icon",children:e.jsx("i",{className:"ri-smartphone-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-perk-title",children:"First access at launch"}),e.jsx("p",{className:"lc-perk-text",children:"In the door the day the app ships on iOS and Android, ahead of the public."})]}),e.jsxs("article",{className:"lc-perk",children:[e.jsx("div",{className:"lc-perk-icon",children:e.jsx("i",{className:"ri-flask-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-perk-title",children:"Beta tester access"}),e.jsx("p",{className:"lc-perk-text",children:"New features land in your app before they go public. Opt-in, any time."})]}),e.jsxs("article",{className:"lc-perk",children:[e.jsx("div",{className:"lc-perk-icon",children:e.jsx("i",{className:"ri-chat-voice-line","aria-hidden":"true"})}),e.jsx("h3",{className:"lc-perk-title",children:"Direct line to founders"}),e.jsx("p",{className:"lc-perk-text",children:"Your feedback shapes what we build next. Email us, and a founder replies."})]})]})]})}),e.jsx("section",{id:"waitlist",className:"lc-final-cta",children:e.jsxs("div",{className:"lc-cta-card",children:[e.jsx("h2",{className:"lc-cta-title",children:"Join before launch."}),e.jsx("p",{className:"lc-cta-sub",children:"One email. Your founding rate locked the moment you sign up, if spots remain."}),e.jsxs("div",{className:"lc-form-wrapper",children:[e.jsx(v,{segment:"regular"}),e.jsx("div",{className:"lc-status-wrapper",children:e.jsx(k,{})})]}),e.jsxs("div",{className:"lc-magic-link-section",children:[e.jsx("h3",{children:"Already on the waitlist?"}),e.jsx(F,{})]})]})}),e.jsxs("footer",{className:"lc-footer",children:[e.jsx(x,{to:"/",className:"lc-footer-logo",children:e.jsx("img",{src:"/curae-logo.png",alt:"Curae",style:{height:"80px",width:"auto"}})}),e.jsx("p",{className:"lc-footer-tagline",children:"Camera-powered skincare intelligence."}),e.jsxs("div",{className:"lc-footer-links",children:[e.jsx(x,{to:"/privacy",children:"Privacy"}),e.jsx("span",{className:"lc-footer-sep",children:"·"}),e.jsx(x,{to:"/contact",children:"Contact"})]}),e.jsxs("p",{className:"lc-footer-copy",children:["© ",new Date().getFullYear()," Curae"]})]})]})};export{M as default};
//# sourceMappingURL=page-BkEA9A8a.js.map
