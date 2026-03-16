import { useState, useRef, useEffect } from "react";

// ─── BRAND DATA ───────────────────────────────────────────────────────────────
// Phone numbers vary by campaign — extracted dynamically from brief text.
const BRAND_URL = {
  "My Holiday":    "MyHoliday.com",
  "My Bali":       "MyBali.com.au",
  "My Queensland": "MyQueensland.com.au",
  "My Fiji":       "MyFiji.com",
  "My Hawaii":     "MyHawaii.com.au",
  "My Maldives":   "MyMaldives.com.au",
  "My Vanuatu":    "MyVanuatu.com.au",
  "My Thailand":   "MyThailand.com.au",
  "My Cruises":    "MyCruises.com.au",
};
const BRANDS = Object.keys(BRAND_URL);
const CRUISE_BRAND = "My Cruises";
const TARGET_BODY_WORDS = 260;

// Extract 1300/1800 number from brief text
function extractPhone(text) {
  const m = text.match(/\b(1[38]00[\s\d]{6,10})\b/);
  return m ? m[1].replace(/\s+/g," ").trim() : null;
}


const C = {
  // Aged paper / warm off-white
  paper:    "#f5f0e8",
  cream:    "#ede6d4",
  parchment:"#e8dfc8",
  // Ink tones
  ink:      "#1c1a14",
  faded:    "#5a5244",
  muted:    "#8a7e6e",
  // Amber / gold accent — departure board, stamp ink
  gold:     "#b8860b",
  amber:    "#c9960e",
  amberBg:  "rgba(184,134,11,0.08)",
  amberBd:  "rgba(184,134,11,0.25)",
  // Dark header — like a split-flap board
  board:    "#111008",
  boardRow: "#181510",
  boardText:"#f0e8d0",
  boardDim: "#6b6050",
  // Utility
  border:   "rgba(100,88,68,0.18)",
  borderMd: "rgba(100,88,68,0.3)",
  white:    "#ffffff",
  greenText:"#4a7a4a",
  greenBg:  "rgba(74,122,74,0.1)",
  greenBd:  "rgba(74,122,74,0.28)",
  errorText:"#8a3020",
};

// Fonts — serif for editorial, mono for airport/data feel
const serif = "'Georgia','Times New Roman',serif";
const mono  = "'Courier New','Courier',monospace";

// ─── AUTO-DETECT ──────────────────────────────────────────────────────────────
function detectFromBrief(text) {
  const t = text.toLowerCase();
  let brand = null;

  // Explicit brand name match first (case-insensitive)
  for (const b of BRANDS) { if (t.includes(b.toLowerCase())) { brand = b; break; } }

  // Destination keyword fallback
  if (!brand) {
    if      (t.includes("fiji"))                                                                          brand = "My Fiji";
    else if (t.includes("hawaii")||t.includes("honolulu")||t.includes("maui")||t.includes("waikiki"))    brand = "My Hawaii";
    else if (t.includes("thailand")||t.includes("phuket")||t.includes("koh samui")||t.includes("krabi")) brand = "My Thailand";
    else if (t.includes("queensland")||t.includes("hamilton island")||t.includes("port douglas")||t.includes("cairns")||t.includes("whitsunday")||t.includes("great barrier reef")) brand = "My Queensland";
    else if (t.includes("maldives"))                                                                      brand = "My Maldives";
    else if (t.includes("bali")||t.includes("ubud")||t.includes("seminyak")||t.includes("canggu"))       brand = "My Bali";
    else if (t.includes("vanuatu")||t.includes("moso")||t.includes("port vila")||t.includes("iririki"))  brand = "My Vanuatu";
    else if (t.includes("cruise line")||t.includes("cruise ship")||t.includes("cruising")||t.includes("aboard")||t.includes("port of call")||t.includes("embarkation")) brand = "My Cruises";
  }

  // isCruise requires multiple unambiguous signals — single words like "cruise" or "sail" fire too often in resort briefs
  const cruiseSignals = [
    t.includes("cruise line"), t.includes("cruise ship"), t.includes("cruising"),
    t.includes("aboard"), t.includes("port of call"), t.includes("embarkation"),
    t.includes("disembarkation"), t.includes("stateroom"), t.includes("gangway"),
    brand === CRUISE_BRAND,
  ].filter(Boolean).length;

  const isCruise = cruiseSignals >= 2 || brand === CRUISE_BRAND;
  return { brand, adType: isCruise ? "cruise" : "resort" };
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a specialist travel advertorial copywriter for News Corp Australia's Body+Soul magazine, writing weekly full-page advertorials for ITG (Inspiring Travel Group) brands.

Study these complete real examples extremely carefully — they define every standard you must meet:

EXAMPLE 1 — "WHITSUNDAY BEST" (My Queensland / Hamilton Island):
HEADLINE: WHITSUNDAY / BEST
STANDFIRST: With the hard stuff sorted and bonuses by the boatload, Hamilton Island's Reef View Hotel has everything you need to skip straight to the relaxation.
BODY P1: Planning a holiday can get a little overwhelming. Should you book the tours first or organise the accommodation? What about airport transfers? And where will we be eating? Suddenly, your break from overthinking leads to even more overthinking.
BODY P2 (subhead EASY GOING): Transfers from Hamilton Island's private airport are sorted. So too, the Whitehaven Beach half-day tour with Cruise Whitsundays. And, for the littlies, a free stay – meals included (don't worry, grown ups: you have a $100 resort credit to spend). Here's where it gets liberating: the entire island is car-free. No rental contracts, no parking stress, no arguing about who's driving. Explore on foot or via golf buggy, with nothing more to worry about than whether to hit the marina or pool first.
BODY P3/CLOSE (subhead ADVENTURE AWAITS): Finish each exciting day with a sunset scene by the beach, or the pool, or… wherever Hammo takes you. Because less holiday planning means more time for holiday-having. Don't overthink it.
CTA: Book with My Queensland. Call 1300 000 753 or visit MyQueensland.com.au.
CAPTION: Reef View Hotel's pool overlooks stunning Catseye Beach. Take a dip; take your pick.
RAIL TITLE: SUNSHINE STATE OF MIND
RAIL BLURB: Reef View Hotel's pool overlooks stunning Catseye Beach. Take a dip; take your pick. [84 chars]
RAIL S1 POOL POSITION: The 35-metre heated swimming pool at Reef View Hotel sits directly opposite Catseye Beach. Both are roughly ten steps from your room, meaning you can flip-flop between the two as the mood strikes. [196 chars]
RAIL S2 TOP GEAR: Non-motorised water sports equipment comes complimentary: pick from windsurfers, kayaks, stand up paddleboards, snorkels… even catamarans. Grab what you need and set off on a Coral Sea adventure. [195 chars]
RAIL S3 SHUTTLE OFF: Hamilton Island's complimentary shuttle bus loops the island continuously. Just flag it down and hop aboard – it's the most carefree commute you'll ever have. [165 chars]

EXAMPLE 2 — "LATE CHECK-OUT" (My Cruises / Singapore to Bali):
HEADLINE: LATE / CHECK-OUT
STANDFIRST: Southeast Asia's cities save their best tricks for nightfall, and this ultra-luxury cruise from Singapore to Bali gives you time to stick around and see them.
BODY P1: Most cruise passengers experience Singapore at lunchtime. They snap a pic of Marina Bay, buy a fridge magnet and shuffle back up the gangway before the city has even loosened its tie. But they're missing out: the real Singapore – hawker stalls sizzling under strip lights, rooftop bars glinting above the strait – belongs to the hours after the day-trippers have departed.
BODY P2 (subhead FLOAT ON): Onboard, the intimate Seven Seas Navigator carries fewer than 500 guests, and its all-inclusive philosophy extends to just about everything that's worth having: open bars, speciality dining at Prime 7 and Sette Mari, unlimited shore excursions and pre-paid gratuities. Away from the shoreline, twelve nights of sailing between ports like Semarang, Surabaya and Komodo Island makes the ship a destination in and of itself – particularly in the early evenings, when the teak pool deck steps sunsets up a notch.
BODY P3/CLOSE (subhead NIGHT MOVES): Starting at $7,990, with up to $4,000 in Bonus Value, My Cruises has assembled a package that rewards the kind of traveller who'd rather linger in a late night warung in Bali than be rushed through a tourist trap gift shop before the day's even begun.
CTA: Book with the Holiday Experts at My Cruises today. Call 1300 924 585 or visit MyCruises.com.au.
RAIL TITLE: DELIGHTFUL DESTINATIONS
RAIL BLURB: From Malaysia to Thailand and beyond, this 12-night cruise of Asia pulls out all the stops. Ready to set sail? [110 chars]
RAIL S1 HANGING IN PENANG: George Town's hawker stalls hit their stride at sundown, with char kway teow woks smoking under strip lights along Chulia Street. By day, UNESCO-listed shophouses and street murals reward the curious. [200 chars]

EXAMPLE 3 — "OPPOSITES ATTRACT" (My Queensland / Port Douglas):
HEADLINE: OPPOSITES / ATTRACT
STANDFIRST: A grown-up tropical escape where one of you can chase a thrill, and the other can stay exactly where the sun hits the water. Now that's romantic.
BODY P1: Contrary to popular belief, the most frictionless couple's holidays don't require all parties to ride the same vibe. It's expected of any solid relationship: if one partner prefers a snorkel, the other wants a sunbed. North Queensland's coastal gem, Port Douglas, has enough on for you to split, reset, reunite – then wander Macrossan Street for gelato like locals.
BODY P2 (subhead POOLSIDE RECOVERY): For the partner who would prefer to unwind horizontally, the adults-only Shantara Resort Port Douglas makes it fabulously easy. Holiday Experts My Queensland's package includes five nights in a Studio Pool View Room, return flights with checked luggage, plus return airport transfers. A bottle of sparkling wine keenly awaits your arrival, and a guaranteed 12pm late checkout means you can finish the trip the way you started it: uuunhurrrriedly. Between languorous laps, slip out for a barefoot stroll on Four Mile Beach.
BODY P3/CLOSE (subhead RAINFOREST RESET): If your other half is calling out for a hit of "we actually did something", consider your included Daintree Sensations full-day tour your big day out: croc-country waterways, shaded boardwalks, the wonder of wandering among the world's oldest rainforest. From $1,299 (valued at $1,899) with Bonus Value up to $1,000, Port Douglas offers proof that the best trips meet in the middle.
RAIL S1 SWIM, READ, REPEAT: Ready for switch-off? Set up by the palm-framed pool, or luxuriate in your Studio Pool View Room and keep an eye on the action from your own balcony. Arrive to a bottle of bubbly, then let the day lead you where it will. [220 chars]

EXAMPLE 4 — "FIJIAN FAST FORWARD" (My Fiji / Outrigger):
HEADLINE: FIJIAN FAST / FORWARD
STANDFIRST: Skip right past the holiday hassles. This wow-worthy Coral Coast resort ensures you're unwinding from the moment your wheels hit the tarmac.
BODY CLOSE: From $2,099 with $2,550 in Bonus Value, it's the holiday that starts, well… the moment it starts.
RAIL S1 BREEZE ON IN: Breeze past the throngs: My Fiji's VIP airport lane is like having a friend in customs. Exclusive transfers and a concierge welcome at Outrigger makes for a seriously smooth arrival. [182 chars]

EXAMPLE 5 — "NORDIC AND NICE" (My Cruises / Scandinavia):
HEADLINE: NORDIC / AND NICE
STANDFIRST: Climb aboard My Cruises' Scandinavian Springtime voyage to discover why Nordic nations are consistently topping global happiness rankings.
RAIL BLURB: Spring across three magnificent Scandinavian destinations, discovering unexpected gems far from the typical tourist trail. [122 chars]
RAIL S2 VISBY VIBES: This UNESCO gem feels frozen in time. Immaculately preserved medieval structures cascade dramatically down to crystalline Swedish waters, while St Mary's Cathedral dominates the skyline in spectacular fashion. [209 chars]
RAIL S3 KRISTIANSAND BLAST: Kristiansand, Norway's southernmost city, boasts beach time and street life alike. Wooden houses line the idyllic waterfront, behind which hidden murals transform laneways into enchanting al fresco art galleries. [212 chars]

EXAMPLE 6 — "LIVE AND LET DIVE" (My Maldives):
HEADLINE: LIVE AND / LET DIVE
STANDFIRST: Speedboats, swirl pools and sunset cocktails: the Maldives' Centara Ras Fushi Resort & Spa redefines island time with five nights of gleeful abandon.
BODY CLOSE (subhead LIQUID LIFESTYLE): Priced from $3,499 – with $3,800 in bonus value (including return flights and speedboat transfers) – the Holiday Experts at My Maldives have crafted a perfect Maldivian escape, complete with USD$50 spa credit per person to make the snap back to reality a little smoother.
RAIL S1 FINS UP: The North Malé Atoll creates as many divers as it attracts. Novice scuba-ers become addicts, while veterans can track manta parades and whale shark gatherings just beyond the reef's edge. [193 chars]

─── ABSOLUTE RULES ──────────────────────────────────────────────────────────────

STRUCTURE: The article flows as a single coherent piece with this shape:
- body_paragraph1: Opens the article. Never names destination/resort/cruise directly. Relatable human observation or ironic framing. Sets up the angle.
- subhead1 + body_paragraph2: Develops the angle. Introduces the package. "The Holiday Experts at [Brand]" appears HERE, exactly once in the whole body.
- subhead2 + body_paragraph3: THE CLOSING SECTION. Continues and concludes the argument. Integrates the price naturally. MUST end with a SHORT PUNCHY WRY CLOSING SENTENCE (10–20 words max) that gives the reader a smile. Examples: "Don't overthink it." / "it's the holiday that starts, well… the moment it starts." / "Port Douglas offers proof that the best trips meet in the middle." / "My Cruises' package proves that your authentic overseas adventure needn't come with hiking boot blisters." THE SUBHEADED SECTIONS ARE PART OF THE BODY — they do not restart the article, they continue and build on the argument.

PUNCTUATION: En dash (–) with spaces either side. NEVER em dash (—). Check every dash before outputting.

PRICING: Woven naturally mid-sentence as contextual detail. NEVER appended as a suffix at the end of a paragraph. NEVER in the CTA.
CORRECT: "Starting at $3,499 – with $3,800 in bonus value – the Holiday Experts at My Maldives have crafted..."
CORRECT: "From $1,299 (valued at $1,899) with Bonus Value up to $1,000, Port Douglas offers proof that..."
WRONG: "...pristine beaches await. From $3,499 with up to $4,000 in Bonus Value."

BRAND NAME: "the Holiday Experts at My ____" appears EXACTLY ONCE in body copy. Never in CTA unless it's the sole brand mention.

CTA: "Book with [Brand]. Call [phone] or visit [URL]." NO price. NO bonus value. Nothing else.

SUBHEADS: Exactly 2. Short, punny, ALL CAPS. Clear complementary pair.

WORD COUNT: Count ONLY the prose in: body_paragraph1 + body_paragraph2 + body_paragraph3. Subhead labels (subhead1/subhead2) do NOT count. Target: exactly 260 words. Count carefully.

STANDFIRST: One sentence. Punchy, specific. Sets up the editorial angle, sells the dream, hooks the reader. Contains a concrete detail or a clever contrast. NOT a generic package summary.

RAIL BLURB: 80–130 characters. One or two short punchy sentences.
RAIL SECTION BODIES: Each 160–220 characters (~25–33 words). Tight, specific, distinct character per section. Resort: 3 standout inclusions/features. Cruise: 3 standout ports.

HEADLINE: Two lines. Line 1 plain/light. Line 2 bold italic. Together a pun or clever wordplay. Study the examples.

NO CONTRASTIVE PHRASES: "not just X but Y", "more than just", "it's not about X", "rather than", "instead of", "beyond mere X". Rewrite the whole sentence.

NO LLMisms: "delve into", "tapestry", "seamless", "elevate", "journey" (metaphorical), "embark" (generic), "unforgettable" (unqualified), "discover", "vibrant".

BANNED ANGLES: daily grind / too busy / constant connectivity / nostalgia / phone fixations / five senses / losing yourself / emails and notifications / decision paralysis.
BANNED OPENINGS: Never open with any variation of "There's something about…" or "There's something in the way…" — this is a cliché opening. Find a wry observation, ironic framing, or specific human truth instead.

AUSTRALIAN ENGLISH throughout.

OUTPUT: Return ONLY a valid raw JSON object. No markdown. No preamble. No trailing text.
Schema: {"headline_line1":"","headline_line2":"","standfirst":"","body_paragraph1":"","subhead1":"","body_paragraph2":"","subhead2":"","body_paragraph3":"","cta_close":"","caption":"","rail_title_line1":"","rail_title_line2":"","rail_blurb":"","rail_section1_title":"","rail_section1_body":"","rail_section2_title":"","rail_section2_body":"","rail_section3_title":"","rail_section3_body":"","rail_cta":""}`;

// ─── FEEDBACK OPTIONS ─────────────────────────────────────────────────────────
const FEEDBACK_OPTIONS = [
  { id:"wordcount", label:null, instruction:(wc)=>`Body prose is ${wc} words. Target is ${TARGET_BODY_WORDS}. Adjust ONLY the body paragraphs to hit ${TARGET_BODY_WORDS} words. Preserve all other fields verbatim. Expand or tighten naturally — don't pad or brutally chop.` },
  { id:"pricing",  label:"Price/bonus value is tacked on",    instruction:()=>"Price and bonus value are appended lazily. Integrate them naturally mid-sentence. See CORRECT examples in system prompt." },
  { id:"holiday",  label:'"Holiday Experts" missing or repeated', instruction:()=>`"the Holiday Experts at My ____" must appear exactly once in body copy. Add or remove as needed.` },
  { id:"contrastive", label:"Find & rephrase contrastive phrases", instruction:()=>"Identify every contrastive construction. List each, then rewrite those sentences from scratch without contrastive structure. Keep all other text identical." },
  { id:"closing",  label:"Closing line is weak or missing",   instruction:()=>"The final sentence of body_paragraph3 must be a punchy wry closer (10–20 words). Examples: 'Don't overthink it.' / 'it's the holiday that starts, well… the moment it starts.' Rewrite last sentence of body_paragraph3 only." },
  { id:"headline", label:"Headline isn't landing",            instruction:()=>"Rewrite headline_line1 and headline_line2 only. Sharper pun — completely different concept. Two lines that feel made for each other." },
  { id:"standfirst",label:"Standfirst is weak",               instruction:()=>"Rewrite standfirst only. One sentence. Hooks the reader, sells the dream, specific detail or clever contrast. Sets up this editorial angle. Not a generic summary." },
  { id:"angle",    label:"Angle is too obvious / well-trodden",instruction:()=>"Find something genuinely unexpected in the inclusions, itinerary rhythm, or destination character. Avoid all banned angles." },
  { id:"opening",  label:"Opening doesn't hook",              instruction:()=>"Rewrite body_paragraph1 only. Must not name destination or resort. Relatable human truth, wry observation, or ironic framing." },
  { id:"tone",     label:"Too generic / reads like AI",        instruction:()=>"Too generic. Cut plainly-used superlatives. Add a wry aside. Make language specific to this property — not interchangeable with any other article." },
  { id:"subheads", label:"Subheads need more wit",             instruction:()=>"Rewrite subhead1 and subhead2 only. Short, punny, complementary pair. Clear throughline between them." },
  { id:"rail",     label:"Right rail feels generic",           instruction:()=>`Rewrite rail sections only. Each body 160–220 chars, tight and specific. Punny subheads. Cruises: distinct port character. Resorts: distinct inclusion highlights.` },
  { id:"theressomething", label:'"There\'s something about…" opening — kill it', instruction:()=>'The opening uses a "There\'s something about…" or "There\'s something in the way…" construction. This is a cliché. Rewrite body_paragraph1 entirely with a fresh angle — wry observation, ironic framing, or specific human truth. No destination or resort name in the opening.' },
  { id:"fresh",    label:"Try a completely different angle",   instruction:()=>"Completely different editorial angle, headline concept, opening hook. Same brief and brand, unrecognisable approach." },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const cw = t => !t ? 0 : t.trim().split(/\s+/).filter(Boolean).length;
const getBodyWC = c => !c ? 0 : ["body_paragraph1","body_paragraph2","body_paragraph3"].reduce((a,f)=>a+cw(c[f]||""),0);
const extractUrls = t => [...new Set((t.match(/https?:\/\/[^\s"'<>)\],]+/g)||[]))].slice(0,3);
const buildLikedContext = liked => !liked.length ? "" :
  `\n\nEXAMPLES PREVIOUSLY APPROVED — study what makes these work:\n${liked.map((l,i)=>`${i+1}. HEADLINE: ${l.headline_line1} / ${l.headline_line2}\n   STANDFIRST: ${l.standfirst}\n   NOTE: ${l.note||"approved overall"}`).join("\n")}`;

async function callClaude(system, userMsg, maxTokens=1600) {
  const r = await fetch("/.netlify/functions/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:maxTokens, system, messages:[{role:"user",content:userMsg}] }),
  });
  if (!r.ok) throw new Error(`API ${r.status}`);
  const d = await r.json();
  return d.content?.map(b=>b.text||"").join("")||"";
}

function parseJSON(raw) {
  const clean = raw.replace(/^```[a-z]*\n?/i,"").replace(/\n?```$/i,"").trim();
  return JSON.parse(clean);
}

// ─── LOADING OVERLAY ──────────────────────────────────────────────────────────
// Split-flap animation effect for the overlay
function SplitFlapChar({char, animating}) {
  return (
    <span style={{
      display:"inline-block", fontFamily:mono, fontSize:"28px", fontWeight:"700",
      color: animating ? C.amber : C.boardText,
      transition:"color 0.3s", letterSpacing:"0.05em",
      textShadow: animating ? `0 0 12px rgba(200,150,14,0.6)` : "none",
    }}>{char}</span>
  );
}

function LoadingOverlay({stage}) {
  const [frame, setFrame] = useState(0);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const label = (stage||"PREPARING COPY").toUpperCase().padEnd(18," ").slice(0,18);
  const [display, setDisplay] = useState(label);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setDisplay(prev => {
        const arr = label.split("");
        const scrambled = arr.map((c,idx) =>
          idx <= i ? c : (c===" " ? " " : chars[Math.floor(Math.random()*chars.length)])
        );
        return scrambled.join("");
      });
      i++;
      if (i > label.length) i = 0;
    }, 80);
    return () => clearInterval(t);
  }, [stage]);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(17,16,8,0.94)",zIndex:1000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"28px",backdropFilter:"blur(4px)"}}>
      <div style={{fontSize:"11px",fontFamily:mono,letterSpacing:"0.4em",color:C.boardDim,textTransform:"uppercase"}}>DEPARTURE LOUNGE</div>
      {/* Split-flap display */}
      <div style={{background:C.boardRow,border:`1px solid rgba(200,150,14,0.2)`,padding:"16px 24px",display:"flex",gap:"2px",boxShadow:"0 0 40px rgba(200,150,14,0.1)"}}>
        {display.split("").map((c,i)=>(
          <div key={i} style={{width:"22px",textAlign:"center",borderRight:i<display.length-1?`1px solid rgba(255,255,255,0.04)`:"none"}}>
            <SplitFlapChar char={c} animating={c!==label[i]&&c!==" "} />
          </div>
        ))}
      </div>
      <div style={{fontSize:"9px",fontFamily:mono,letterSpacing:"0.32em",color:C.boardDim}}>PLEASE WAIT</div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

// ─── PARTIAL LOADING SHIMMER ──────────────────────────────────────────────────
function Shimmer({height=18, width="100%"}) {
  return (
    <div style={{height,width,background:`linear-gradient(90deg,${C.parchment} 0%,${C.cream} 50%,${C.parchment} 100%)`,backgroundSize:"200% 100%",animation:"shimmer 1.4s ease-in-out infinite",borderRadius:"2px"}}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

// ─── WORD COUNT BADGE ─────────────────────────────────────────────────────────
function WcBadge({count}) {
  const diff = count - TARGET_BODY_WORDS;
  const ok = Math.abs(diff) <= 12;
  const over = diff > 0;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"2px 9px",fontSize:"10px",fontFamily:mono,background:ok?C.greenBg:over?C.amberBg:"rgba(180,140,20,0.1)",color:ok?C.greenText:over?C.gold:"#7a6810",border:`1px solid ${ok?C.greenBd:over?C.amberBd:"rgba(180,140,20,0.3)"}`}}>
      {count}w{ok?" ✓":`(${over?"+":""}${diff})`}
    </span>
  );
}

// ─── BOARDING PASS LABEL ──────────────────────────────────────────────────────
function BPLabel({children, style={}}) {
  return <div style={{fontSize:"8px",fontFamily:mono,letterSpacing:"0.32em",color:C.muted,textTransform:"uppercase",marginBottom:"6px",...style}}>{children}</div>;
}

// ─── SMALL ACTION BUTTON ──────────────────────────────────────────────────────
function SmBtn({label, onClick, loading=false, title=""}) {
  return (
    <button onClick={onClick} disabled={loading} title={title}
      style={{padding:"3px 10px",fontSize:"9px",fontFamily:mono,letterSpacing:"0.14em",textTransform:"uppercase",cursor:loading?"wait":"pointer",background:"transparent",color:loading?C.muted:C.faded,border:`1px solid ${C.border}`,transition:"all 0.14s",opacity:loading?0.6:1,display:"inline-flex",alignItems:"center",gap:"5px"}}>
      {loading?<><span style={{animation:"blink 0.8s infinite",display:"inline-block"}}>▸</span> wait</>:label}
    </button>
  );
}

// ─── GATE TAG ─────────────────────────────────────────────────────────────────
function GateTag({children, style={}}) {
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"3px 10px",border:`1px solid ${C.amberBd}`,background:C.amberBg,...style}}>
      <span style={{fontSize:"7.5px",fontFamily:mono,letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold}}>{children}</span>
    </div>
  );
}

// ─── PRIMARY BUTTON — defined outside App to prevent remount on every render ──
function PBtn({onClick, disabled, children, variant="primary"}) {
  const s = variant==="primary"
    ? {background:disabled?"#3a3628":C.amber, color:disabled?C.boardDim:C.board, boxShadow:disabled?"none":`0 2px 14px rgba(200,150,14,0.35)`, border:"none"}
    : variant==="outline"
    ? {background:"transparent", color:C.amber, border:`1px solid ${C.amberBd}`, boxShadow:"none"}
    : {background:"transparent", color:C.muted, border:`1px solid ${C.border}`, boxShadow:"none"};
  return <button onClick={onClick} disabled={disabled} style={{...s, padding:"11px 28px", fontSize:"9px", fontFamily:mono, letterSpacing:"0.28em", textTransform:"uppercase", cursor:disabled?"not-allowed":"pointer", transition:"all 0.16s"}}>{children}</button>;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [brief,       setBrief]       = useState("");
  const [brand,       setBrand]       = useState("");
  const [adType,      setAdType]      = useState("resort");
  const [autoDetected,setAutoDetected]= useState(false);
  const [loading,     setLoading]     = useState(false);
  const [partialLoad, setPartialLoad] = useState(""); // which section is doing a partial regen
  const [stage,       setStage]       = useState("");
  const [copy,        setCopy]        = useState(null);
  const [error,       setError]       = useState("");
  const [copied,      setCopied]      = useState(false);
  const [fetchedN,    setFetchedN]    = useState(0);
  const [urlContent,  setUrlContent]  = useState("");
  const [selFb,       setSelFb]       = useState([]);
  const [custFb,      setCustFb]      = useState("");
  const [showFb,      setShowFb]      = useState(false);
  const [revHistory,  setRevHistory]  = useState([]);
  const [hlHistory,   setHlHistory]   = useState([]);
  const [liked,       setLiked]       = useState([]);
  const [showLiked,   setShowLiked]   = useState(false);
  const outRef = useRef(null);
  const fbRef  = useRef(null);
  const manualBrand  = useRef(false);
  const manualAdType = useRef(false);
  const prevBriefLen = useRef(0);
  const wc = getBodyWC(copy);
  const detectedUrls = extractUrls(brief);

  // Auto-detect brand + type — fires when brief goes from empty to populated (paste detection),
  // and on subsequent changes only if user hasn't manually overridden.
  useEffect(() => {
    const trimmed = brief.trim();
    const wasEmpty = prevBriefLen.current === 0;
    prevBriefLen.current = trimmed.length;
    if (!trimmed || copy) return;

    // Only run detection on initial paste (empty→content) or if nothing was manually set
    if (!wasEmpty && manualBrand.current && manualAdType.current) return;

    const { brand:b, adType:t } = detectFromBrief(trimmed);

    if (!manualBrand.current && b) {
      setBrand(b);
      setAutoDetected(true);
    }
    if (!manualAdType.current && (b || wasEmpty)) {
      // Only update adType if we have a confident signal (brand detected, or first paste)
      setAdType(t);
    }
  }, [brief]);

  // URL fetcher
  const fetchUrls = async (urls) => {
    let content="", n=0;
    for (const u of urls) {
      try {
        const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,{signal:AbortSignal.timeout(8000)});
        if (r.ok) {
          const d = await r.json();
          if (d.contents) {
            const t = d.contents.replace(/<style[^>]*>[\s\S]*?<\/style>/gi,"").replace(/<script[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<[^>]+>/g," ").replace(/\s{3,}/g,"\n").trim().slice(0,3000);
            if (t.length>100) { content+=`\n\n--- PAGE: ${u} ---\n${t}`; n++; }
          }
        }
      } catch {}
    }
    return {content,n};
  };

  // Prompt builder
  const buildPrompt = (isRefresh, uc, fbInstr, curCopy) => {
    const phone = extractPhone(brief) || "see brief";
    const likedCtx = buildLikedContext(liked);
    const hlCtx = hlHistory.length ? `\nPREVIOUSLY GENERATED HEADLINES — do not repeat any:\n${hlHistory.map(h=>`- ${h}`).join("\n")}` : "";
    const check = `\nSELF-CHECK before outputting:\n☑ En dash (–) with spaces — NEVER em dash (—)\n☑ Price woven mid-sentence, not appended, not in CTA\n☑ "the Holiday Experts at ${brand}" exactly once in body\n☑ No contrastive phrases\n☑ Body paragraphs (p1+p2+p3 prose only) = exactly ${TARGET_BODY_WORDS} words\n☑ body_paragraph3 ends with a 10–20 word wry closer\n☑ Rail blurb 80–130 chars; each rail section 160–220 chars\n☑ CTA: NO price, NO bonus value\n\nReturn ONLY raw JSON. No markdown.`;

    if (isRefresh) return `REVISION MODE. Brand: ${brand} | Phone: ${phone} | URL: ${BRAND_URL[brand]} | Type: ${adType.toUpperCase()}

Change ONLY what the feedback requests. Copy all other fields VERBATIM. Every change must feel coherent within the whole piece.

REVISION HISTORY THIS SESSION:
${revHistory.length ? revHistory.map((r,i)=>`${i+1}. ${r}`).join("\n") : "(none yet)"}

FEEDBACK TO ADDRESS NOW:
${fbInstr.join("\n")}

FULL CURRENT ARTICLE (preserve unrequested fields verbatim):
${JSON.stringify(curCopy,null,2)}

BRIEF (context):
${brief}${uc}
${hlCtx}${likedCtx}${check}`;

    return `Ad type: ${adType.toUpperCase()} | Brand: ${brand} | Phone: ${phone} | URL: ${BRAND_URL[brand]}

Find a fresh editorial angle. Push past the obvious first thoughts. Lightness, charm, wit.${adType==="cruise"?" Focus on the experience philosophy — why this itinerary rhythm works, not just listing ports.":""}

BRIEF:
${brief}${uc}
${hlCtx}${likedCtx}${check}`;
  };

  // Full generate / regenerate
  const generate = async (isRefresh=false) => {
    if (!brief.trim()) return;
    if (!brand) { setError("Please select a brand before generating."); return; }
    setLoading(true); setError("");
    if (!isRefresh) { setCopy(null); setFetchedN(0); setUrlContent(""); setShowFb(false); setRevHistory([]); }

    let uc = urlContent;
    if (!isRefresh && detectedUrls.length>0) {
      setStage(`FETCHING ${detectedUrls.length} PAGE${detectedUrls.length>1?"S":""}…`);
      const {content,n} = await fetchUrls(detectedUrls);
      uc=content; setUrlContent(content); setFetchedN(n);
    }
    setStage(isRefresh?"REGENERATING…":"GENERATING COPY…");

    const fbInstr=[];
    if (isRefresh) {
      selFb.forEach(id=>{const o=FEEDBACK_OPTIONS.find(x=>x.id===id);if(o)fbInstr.push(o.instruction(wc));});
      if (custFb.trim()) fbInstr.push(`Additional direction: ${custFb.trim()}`);
      if (!fbInstr.length) fbInstr.push("Previous attempt wasn't right. Try a completely different angle — new headline concept, new opening hook, new editorial lens on the same brief.");
      setRevHistory(prev=>[...prev,...fbInstr]);
    }
    try {
      const raw = await callClaude(SYSTEM_PROMPT, buildPrompt(isRefresh,uc,fbInstr,copy));
      const parsed = parseJSON(raw);
      setCopy(parsed);
      setHlHistory(prev=>[...new Set([...prev,`${parsed.headline_line1} / ${parsed.headline_line2}`])].slice(-5));
      setShowFb(false); setSelFb([]); setCustFb("");
      setTimeout(()=>outRef.current?.scrollIntoView({behavior:"smooth"}),100);
    } catch(e) { setError(`Generation failed: ${e.message}`); }
    finally { setLoading(false); setStage(""); }
  };

  // Per-section regen
  const regenSection = async (sectionKey, instruction) => {
    if (!copy||!brief.trim()) return;
    setPartialLoad(sectionKey);
    const isHl = sectionKey.includes("headline");
    const prompt=`TARGETED REVISION. Brand: ${brand} | Type: ${adType.toUpperCase()}

Rewrite ONLY: ${sectionKey}. Consider full article context. Preserve all other fields verbatim.

INSTRUCTION: ${instruction}

FULL CURRENT ARTICLE:
${JSON.stringify(copy,null,2)}

BRIEF (context): ${brief}
${isHl?`\nPREVIOUSLY GENERATED HEADLINES (do not repeat): ${hlHistory.join("; ")}`:""}

Return ONLY raw JSON with ALL fields. No markdown.`;
    try {
      const raw = await callClaude(SYSTEM_PROMPT,prompt);
      const parsed = parseJSON(raw);
      setCopy(parsed);
      if (isHl) setHlHistory(prev=>[...new Set([...prev,`${parsed.headline_line1} / ${parsed.headline_line2}`])].slice(-5));
    } catch(e) { setError(`Section regen failed: ${e.message}`); }
    finally { setPartialLoad(""); }
  };

  const thumbsUp = () => { if(!copy) return; setLiked(p=>[...p,{...copy,note:`${adType} / ${brand}`}]); };
  const toggleFb = id => setSelFb(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const copyAll = () => {
    if (!copy) return;
    const lines = [
      `HEADLINE: ${copy.headline_line1} / ${copy.headline_line2}`,
      `STANDFIRST: ${copy.standfirst}`,"",
      copy.body_paragraph1,"",
      `[${copy.subhead1}]`,copy.body_paragraph2,"",
      `[${copy.subhead2}]`,copy.body_paragraph3,"",
      copy.cta_close,"",`CAPTION: ${copy.caption}`,"",
      "--- RIGHT RAIL ---",
      `TITLE: ${copy.rail_title_line1}${copy.rail_title_line2?" / "+copy.rail_title_line2:""}`,
      `BLURB: ${copy.rail_blurb}`,"",
      `[${copy.rail_section1_title}]`,copy.rail_section1_body,"",
      `[${copy.rail_section2_title}]`,copy.rail_section2_body,"",
      `[${copy.rail_section3_title}]`,copy.rail_section3_body,"",
      copy.rail_cta,
    ].filter(l=>l!=null);
    navigator.clipboard.writeText(lines.join("\n")).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };

  const resetAll = () => {
    setCopy(null);setBrief("");setBrand("");setAdType("resort");setFetchedN(0);setUrlContent("");setShowFb(false);
    setSelFb([]);setCustFb("");setRevHistory([]);setHlHistory([]);setAutoDetected(false);
    manualBrand.current=false; manualAdType.current=false; prevBriefLen.current=0;
    window.scrollTo({top:0,behavior:"smooth"});
  };

  // ─── CURRENT DATE for boarding pass feel ─────────────────────────────────
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase();

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:C.paper,fontFamily:serif,color:C.ink}}>
      {loading && <LoadingOverlay stage={stage}/>}

      {/* ── HEADER — split-flap departure board style ── */}
      <header style={{background:C.board,borderBottom:`1px solid rgba(200,150,14,0.12)`}}>
        {/* Top strip — like airport gate info */}
        <div style={{borderBottom:`1px solid rgba(255,255,255,0.05)`,padding:"6px 48px"}}>
          <div style={{maxWidth:"1120px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:"8px",fontFamily:mono,letterSpacing:"0.36em",color:C.boardDim,textTransform:"uppercase"}}>ITG · NEWS CORP AUSTRALIA</div>
            <div style={{fontSize:"8px",fontFamily:mono,letterSpacing:"0.28em",color:C.boardDim}}>{dateStr}</div>
          </div>
        </div>
        {/* Main row */}
        <div style={{maxWidth:"1120px",margin:"0 auto",padding:"0 48px",display:"flex",alignItems:"center",gap:"0"}}>
          {/* Wordmark */}
          <div style={{padding:"16px 0 13px",flex:1}}>
            <div style={{display:"flex",alignItems:"baseline",gap:"3px"}}>
              <span style={{fontSize:"30px",fontWeight:"700",fontFamily:mono,color:C.boardText,letterSpacing:"-0.02em",lineHeight:1}}>DEPARTURE</span>
              <span style={{fontSize:"30px",fontWeight:"700",fontFamily:mono,color:C.amber,letterSpacing:"-0.02em",lineHeight:1}}>_</span>
              <span style={{fontSize:"30px",fontWeight:"700",fontFamily:mono,color:C.boardText,letterSpacing:"-0.02em",lineHeight:1}}>LOUNGE</span>
            </div>
            <div style={{fontSize:"8px",fontFamily:mono,letterSpacing:"0.32em",color:C.boardDim,marginTop:"3px"}}>COPY GENERATION SYSTEM — ITG BODY+SOUL</div>
          </div>

          {/* Ad type toggle */}
          <div style={{display:"flex",gap:"4px",padding:"0 0 0 28px",borderLeft:`1px solid rgba(255,255,255,0.05)`,marginLeft:"24px"}}>
            {[["resort","✦ RESORT"],["cruise","⚓ CRUISE"]].map(([t,label])=>(
              <button key={t} onClick={()=>{manualAdType.current=true;setAdType(t);if(t==="resort"&&brand===CRUISE_BRAND){manualBrand.current=false;setBrand("");}setCopy(null);setShowFb(false);}}
                style={{padding:"7px 16px",fontSize:"8px",fontFamily:mono,letterSpacing:"0.2em",cursor:"pointer",transition:"all 0.14s",background:adType===t?C.amber:"transparent",color:adType===t?C.board:C.boardDim,border:adType===t?"none":`1px solid rgba(200,150,14,0.18)`}}>
                {label}
              </button>
            ))}
          </div>

          {liked.length>0&&(
            <button onClick={()=>setShowLiked(v=>!v)} style={{marginLeft:"16px",padding:"6px 12px",fontSize:"8px",fontFamily:mono,letterSpacing:"0.2em",cursor:"pointer",background:"transparent",color:"#7ab87a",border:`1px solid rgba(100,180,100,0.25)`,textTransform:"uppercase"}}>
              ♥ {liked.length}
            </button>
          )}
        </div>
      </header>

      {/* ── LIKED PANEL ── */}
      {showLiked&&liked.length>0&&(
        <div style={{background:C.boardRow,borderBottom:`1px solid rgba(200,150,14,0.1)`,padding:"16px 48px"}}>
          <div style={{maxWidth:"1120px",margin:"0 auto"}}>
            <div style={{fontSize:"8px",fontFamily:mono,letterSpacing:"0.32em",color:C.boardDim,marginBottom:"10px"}}>APPROVED EXAMPLES — INFORMING FUTURE OUTPUT</div>
            {liked.map((l,i)=>(
              <div key={i} style={{display:"inline-flex",alignItems:"center",gap:"10px",marginRight:"12px",marginBottom:"6px",padding:"5px 12px",background:"rgba(200,150,14,0.07)",border:`1px solid ${C.amberBd}`}}>
                <span style={{fontSize:"11px",fontFamily:mono,color:C.boardText,letterSpacing:"0.04em"}}>{l.headline_line1} / {l.headline_line2}</span>
                <button onClick={()=>setLiked(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:C.boardDim,fontSize:"13px",lineHeight:1}}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BRIEF FORM ── */}
      <div style={{maxWidth:"1120px",margin:"0 auto",padding:"36px 48px 0"}}>
        {/* Boarding pass style form header */}
        <div style={{display:"flex",alignItems:"stretch",gap:"0",marginBottom:"22px",border:`1px solid ${C.border}`,background:C.cream}}>
          {/* Gate / Brand */}
          <div style={{flex:"0 0 220px",padding:"16px 20px",borderRight:`1px solid ${C.border}`}}>
            <BPLabel>Destination brand {autoDetected&&!copy&&<span style={{color:C.gold}}> ✦ AUTO</span>}</BPLabel>
            <div style={{position:"relative"}}>
              <select value={brand} onChange={e=>{manualBrand.current=true;setBrand(e.target.value);if(e.target.value===CRUISE_BRAND){manualAdType.current=true;setAdType("cruise");}setAutoDetected(false);}}
                style={{width:"100%",appearance:"none",background:"transparent",border:"none",borderBottom:`2px solid ${brand?(autoDetected?C.amber:C.border):C.errorText}`,color:brand?C.ink:C.muted,padding:"6px 28px 6px 0",fontSize:"16px",fontFamily:mono,fontWeight:"700",cursor:"pointer",outline:"none",letterSpacing:"0.02em"}}>
                <option value="">My …</option>
                {BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
              <div style={{position:"absolute",right:"4px",top:"50%",transform:"translateY(-50%)",fontSize:"9px",color:C.gold,pointerEvents:"none"}}>▾</div>
            </div>
          </div>
          {/* Flight type */}
          <div style={{flex:"0 0 120px",padding:"16px 20px",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
            <BPLabel>Type</BPLabel>
            <div style={{fontSize:"13px",fontFamily:mono,fontWeight:"700",color:adType==="cruise"?C.amber:C.ink,letterSpacing:"0.06em"}}>{adType.toUpperCase()}</div>
          </div>
          {/* Status */}
          <div style={{flex:"0 0 140px",padding:"16px 20px",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
            <BPLabel>Status</BPLabel>
            <div style={{fontSize:"11px",fontFamily:mono,color:copy?C.greenText:C.gold,letterSpacing:"0.08em",fontWeight:"700"}}>
              {copy?"COPY READY":"AWAITING BRIEF"}
            </div>
          </div>
          {/* URL count */}
          <div style={{flex:1,padding:"16px 20px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
            <BPLabel>URLs detected</BPLabel>
            <div style={{fontSize:"11px",fontFamily:mono,color:detectedUrls.length>0?C.gold:C.muted,letterSpacing:"0.08em"}}>
              {detectedUrls.length>0?`${detectedUrls.length} page${detectedUrls.length>1?"s":""} — will fetch`:"—"}
            </div>
          </div>
        </div>

        <div style={{marginBottom:"18px"}}>
          <BPLabel>Brief</BPLabel>
          <textarea value={brief} onChange={e=>setBrief(e.target.value)}
            placeholder={adType==="resort"
              ?"Paste the Google Doc brief here — property name, destination, room type, nights, price from, bonus value, inclusions. Include any URLs — they'll be fetched automatically."
              :"Paste the Google Doc brief here — cruise name, ship, route, nights, price from, bonus value, inclusions, key ports, sail date. Include any URLs — they'll be fetched."}
            rows={9} style={{width:"100%",background:C.cream,boxSizing:"border-box",border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.amber}`,color:C.ink,padding:"14px 16px",fontSize:"14px",fontFamily:serif,lineHeight:"1.8",resize:"vertical",outline:"none"}} />
        </div>

        <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
          <PBtn onClick={()=>generate(false)} disabled={loading||!brief.trim()}>
            {loading&&!partialLoad?(stage||"WORKING…"):"GENERATE COPY →"}
          </PBtn>
          {!brand&&brief.trim()&&<span style={{fontSize:"10px",fontFamily:mono,color:C.muted,letterSpacing:"0.12em"}}>← pick a brand</span>}
          {!loading&&fetchedN>0&&<span style={{fontSize:"10px",fontFamily:mono,color:C.greenText,letterSpacing:"0.16em"}}>✓ {fetchedN} PAGE{fetchedN>1?"S":""} FETCHED</span>}
        </div>
        {error&&<div style={{marginTop:"12px",color:C.errorText,fontFamily:mono,fontSize:"12px",letterSpacing:"0.06em"}}>{error}</div>}
      </div>

      {/* ── OUTPUT ── */}
      {copy&&(
        <div ref={outRef} style={{maxWidth:"1120px",margin:"48px auto 0",padding:"0 48px 80px"}}>

          {/* Output header bar */}
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"36px",paddingBottom:"16px",borderBottom:`1px solid ${C.border}`}}>
            <GateTag>Advertising Feature</GateTag>
            <div style={{flex:1}}/>
            <button onClick={copyAll} style={{padding:"7px 16px",fontSize:"8px",fontFamily:mono,letterSpacing:"0.22em",textTransform:"uppercase",cursor:"pointer",background:copied?C.greenBg:"transparent",color:copied?C.greenText:C.muted,border:`1px solid ${copied?C.greenBd:C.border}`,transition:"all 0.16s"}}>
              {copied?"✓ COPIED":"COPY ALL COPY"}
            </button>
            <button onClick={thumbsUp} title="Approve this piece — informs future output" style={{padding:"7px 12px",fontSize:"13px",background:"transparent",border:`1px solid ${C.border}`,cursor:"pointer",color:C.muted,transition:"all 0.14s"}}>♥</button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 268px",gap:"52px"}}>
            {/* ── ARTICLE COLUMN ── */}
            <div>
              {/* Headline */}
              <div style={{marginBottom:"24px"}}>
                {partialLoad==="headline"
                  ?<><Shimmer height={60} style={{marginBottom:"8px"}}/><Shimmer height={60}/></>
                  :<>
                    <div style={{fontSize:"58px",lineHeight:"1.0",fontWeight:"300",letterSpacing:"-0.01em",marginBottom:"2px"}}>{copy.headline_line1}</div>
                    <div style={{fontSize:"58px",lineHeight:"1.0",fontWeight:"800",fontStyle:"italic",color:C.gold,letterSpacing:"-0.02em",marginBottom:"10px"}}>{copy.headline_line2}</div>
                  </>
                }
                <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"14px"}}>
                  <SmBtn label="↺ headline" loading={partialLoad==="headline"} onClick={()=>regenSection("headline","Rewrite headline_line1 and headline_line2 only. Completely different pun or wordplay concept from current. Two lines that feel made for each other.")} />
                </div>

                {/* Standfirst */}
                <div style={{borderLeft:`3px solid ${C.amber}`,paddingLeft:"16px",background:`linear-gradient(to right,${C.amberBg},transparent)`,paddingTop:"6px",paddingBottom:"8px",marginTop:"4px"}}>
                  <BPLabel style={{color:C.gold,marginBottom:"4px"}}>Standfirst</BPLabel>
                  {partialLoad==="standfirst"
                    ?<Shimmer height={40}/>
                    :<div style={{fontSize:"14.5px",lineHeight:"1.58",color:C.faded,fontStyle:"italic",marginBottom:"8px"}}>{copy.standfirst}</div>
                  }
                  <SmBtn label="↺ standfirst" loading={partialLoad==="standfirst"} onClick={()=>regenSection("standfirst","Rewrite standfirst only. One punchy sentence. Hooks the reader, sells the dream, contains a specific detail or clever contrast. Must set up the editorial angle.")} />
                </div>
              </div>

              {/* Body copy label + badge */}
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
                <span style={{fontSize:"8px",fontFamily:mono,letterSpacing:"0.28em",color:C.muted,textTransform:"uppercase"}}>Body copy</span>
                <WcBadge count={wc}/>
                <span style={{fontSize:"9px",fontFamily:mono,color:C.muted}}>target {TARGET_BODY_WORDS}w</span>
              </div>

              {/* P1 */}
              <p style={{fontSize:"14.5px",lineHeight:"1.86",color:C.ink,marginBottom:"20px",marginTop:0}}>{copy.body_paragraph1}</p>

              {/* Subhead 1 */}
              <div style={{marginBottom:"20px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
                  {partialLoad==="subhead1"?<Shimmer height={14} width="160px"/>
                    :<span style={{fontSize:"9px",fontFamily:mono,letterSpacing:"0.22em",textTransform:"uppercase",color:C.gold,fontWeight:"700"}}>{copy.subhead1}</span>
                  }
                  <SmBtn label="↺" loading={partialLoad==="subhead1"} title="Try this subhead again" onClick={()=>regenSection("subhead1","Rewrite subhead1 only. Must pair well with subhead2. Short, punny, ALL CAPS.")} />
                </div>
                <div style={{height:"1px",background:C.border,marginBottom:"10px"}}/>
                <p style={{fontSize:"14.5px",lineHeight:"1.86",color:C.ink,marginBottom:0,marginTop:0}}>{copy.body_paragraph2}</p>
              </div>

              {/* Subhead 2 */}
              <div style={{marginBottom:"20px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
                  {partialLoad==="subhead2"?<Shimmer height={14} width="160px"/>
                    :<span style={{fontSize:"9px",fontFamily:mono,letterSpacing:"0.22em",textTransform:"uppercase",color:C.gold,fontWeight:"700"}}>{copy.subhead2}</span>
                  }
                  <SmBtn label="↺" loading={partialLoad==="subhead2"} title="Try this subhead again" onClick={()=>regenSection("subhead2","Rewrite subhead2 only. Must pair well with subhead1. Short, punny, ALL CAPS.")} />
                </div>
                <div style={{height:"1px",background:C.border,marginBottom:"10px"}}/>
                <p style={{fontSize:"14.5px",lineHeight:"1.86",color:C.ink,marginBottom:0,marginTop:0}}>{copy.body_paragraph3}</p>
              </div>

              <div style={{marginTop:"18px",paddingTop:"14px",borderTop:`1px solid ${C.border}`,fontSize:"13px",lineHeight:"1.72",color:C.faded,fontStyle:"italic"}}>{copy.cta_close}</div>
              {copy.caption&&<div style={{marginTop:"10px",fontSize:"10px",fontFamily:mono,color:C.muted,letterSpacing:"0.06em"}}>CAPTION: {copy.caption}</div>}
            </div>

            {/* ── RAIL COLUMN ── */}
            <div style={{borderLeft:`1px solid ${C.border}`,paddingLeft:"28px"}}>
              <div style={{textAlign:"center",marginBottom:"18px",paddingBottom:"16px",borderBottom:`1px solid ${C.border}`}}>
                {partialLoad==="rail_header"
                  ?<><Shimmer height={16} style={{marginBottom:"6px"}}/><Shimmer height={12}/></>
                  :<>
                    <div style={{fontSize:"11.5px",fontWeight:"700",fontFamily:mono,letterSpacing:"0.1em",textTransform:"uppercase",color:C.ink,lineHeight:"1.35",marginBottom:"6px"}}>
                      {copy.rail_title_line1}{copy.rail_title_line2&&<><br/>{copy.rail_title_line2}</>}
                    </div>
                    <div style={{fontSize:"11.5px",lineHeight:"1.64",color:C.faded,fontStyle:"italic",paddingTop:"8px",borderTop:`1px solid ${C.border}`}}>{copy.rail_blurb}</div>
                  </>
                }
                <div style={{marginTop:"8px"}}>
                  <SmBtn label="↺ rail header" loading={partialLoad==="rail_header"} onClick={()=>regenSection("rail_header","Rewrite rail_title_line1, rail_title_line2, and rail_blurb only. Rail blurb must be 80–130 characters.")} />
                </div>
              </div>

              {[[copy.rail_section1_title,copy.rail_section1_body],[copy.rail_section2_title,copy.rail_section2_body],[copy.rail_section3_title,copy.rail_section3_body]].filter(([t])=>t).map(([title,body],i)=>(
                <div key={i} style={{marginBottom:"16px"}}>
                  <div style={{fontSize:"8.5px",fontFamily:mono,letterSpacing:"0.2em",textTransform:"uppercase",color:C.gold,fontWeight:"700",marginBottom:"5px"}}>{title}</div>
                  <div style={{fontSize:"11.5px",lineHeight:"1.7",color:C.faded,fontStyle:"italic"}}>{body}</div>
                  {i<2&&<div style={{marginTop:"14px",height:"1px",background:C.border}}/>}
                </div>
              ))}
              {copy.rail_cta&&<div style={{marginTop:"12px",paddingTop:"10px",borderTop:`1px solid ${C.border}`,fontSize:"10.5px",fontFamily:mono,lineHeight:"1.7",color:C.muted,textAlign:"center",letterSpacing:"0.04em"}}>{copy.rail_cta}</div>}
            </div>
          </div>

          {/* ── ACTION ROW ── */}
          <div style={{marginTop:"32px",paddingTop:"20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
            <PBtn onClick={()=>generate(true)} disabled={loading}>{loading?(stage||"WORKING…"):"TRY AGAIN →"}</PBtn>
            <PBtn variant="outline" onClick={()=>{setShowFb(v=>!v);if(!showFb)setTimeout(()=>fbRef.current?.scrollIntoView({behavior:"smooth"}),100);}} disabled={loading}>
              {showFb?"HIDE REVISE PANEL":"REVISE →"}
            </PBtn>
            <div style={{flex:1}}/>
            <PBtn variant="ghost" onClick={resetAll}>NEW BRIEF</PBtn>
          </div>

          {/* ── FEEDBACK PANEL ── */}
          {showFb&&(
            <div ref={fbRef} style={{marginTop:"24px",padding:"26px 30px",background:C.cream,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.amber}`}}>
              <div style={{fontSize:"8px",fontFamily:mono,letterSpacing:"0.34em",color:C.muted,textTransform:"uppercase",marginBottom:"16px"}}>What needs fixing?</div>

              {revHistory.length>0&&(
                <div style={{marginBottom:"16px",padding:"10px 14px",background:C.parchment,border:`1px solid ${C.border}`,fontSize:"10px",fontFamily:mono,color:C.muted,letterSpacing:"0.04em",lineHeight:"1.7"}}>
                  <div style={{fontSize:"8px",letterSpacing:"0.28em",textTransform:"uppercase",color:C.muted,marginBottom:"5px"}}>Revision log this session</div>
                  {revHistory.map((r,i)=><div key={i}>› {r.slice(0,90)}{r.length>90?"…":""}</div>)}
                </div>
              )}

              <div style={{display:"flex",flexDirection:"column",gap:"5px",marginBottom:"18px"}}>
                {FEEDBACK_OPTIONS.map(opt=>{
                  const isWC=opt.id==="wordcount";
                  const diff=wc-TARGET_BODY_WORDS;
                  const label=isWC?`Body copy word count — currently ${wc}w (${diff>0?"+":""}${diff} vs target ${TARGET_BODY_WORDS}w)`:opt.label;
                  const checked=selFb.includes(opt.id);
                  const warn=isWC&&Math.abs(diff)>12;
                  return (
                    <div key={opt.id} onClick={()=>toggleFb(opt.id)}
                      style={{display:"flex",alignItems:"flex-start",gap:"10px",cursor:"pointer",padding:"7px 10px",background:checked?C.amberBg:"transparent",border:`1px solid ${checked?C.amberBd:"transparent"}`,transition:"all 0.12s"}}>
                      <div style={{width:"13px",height:"13px",flexShrink:0,marginTop:"2px",border:`1.5px solid ${checked?C.amber:C.borderMd}`,background:checked?C.amber:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.12s"}}>
                        {checked&&<span style={{color:C.board,fontSize:"8px",lineHeight:1,fontFamily:mono}}>✓</span>}
                      </div>
                      <span style={{fontSize:"12.5px",fontFamily:serif,color:checked?C.ink:warn?C.gold:C.faded,fontStyle:"italic",lineHeight:"1.5",userSelect:"none"}}>{label}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{marginBottom:"16px"}}>
                <BPLabel>Anything else?</BPLabel>
                <textarea value={custFb} onChange={e=>setCustFb(e.target.value)}
                  placeholder="Specific notes — applied even if no boxes are checked above" rows={3}
                  style={{width:"100%",boxSizing:"border-box",background:C.parchment,border:`1px solid ${C.border}`,color:C.ink,padding:"10px 13px",fontSize:"13px",fontFamily:serif,fontStyle:"italic",lineHeight:"1.72",resize:"vertical",outline:"none"}}/>
              </div>

              <PBtn onClick={()=>generate(true)} disabled={loading}>{loading?"REGENERATING…":"REGENERATE →"}</PBtn>
            </div>
          )}
        </div>
      )}
      <style>{`* { box-sizing: border-box; } body { margin: 0; } select option { font-style: normal; }`}</style>
    </div>
  );
}
