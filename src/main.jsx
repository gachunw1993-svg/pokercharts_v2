
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, ShieldAlert, Target, Trophy, Layers, Sparkles } from "lucide-react";
import "./style.css";

const ranks = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];

const positionsByFormat = {
  "Tournament 8-Handed": ["UTG","UTG+1","LJ","HJ","CO","BTN","SB","BB"],
  "Tournament 6-Handed": ["LJ","HJ","CO","BTN","SB","BB"],
  "Cash 6-Max": ["LJ","HJ","CO","BTN","SB","BB"],
  "Cash 9-Handed": ["UTG","UTG+1","UTG+2","LJ","HJ","CO","BTN","SB","BB"],
};

const scenarios = [
  "Unopened Pot / RFI",
  "Facing Open",
  "Facing 3-Bet",
  "Facing 4-Bet",
  "Short Stack Open Jam",
  "Facing Jam",
  "BB Defense"
];

const villainCounts = ["0", "1", "2", "3+"];
const stackOptions = ["5","8","10","12","15","20","25","30","40","60","100","150"];

const seatWeight = {
  "UTG":0, "UTG+1":1, "UTG+2":2, "LJ":3, "HJ":4, "CO":5, "BTN":6, "SB":7, "BB":8
};

const rangeTemplates = {
  veryTight: ["AA","KK","QQ","JJ","TT","AKs","AQs","AKo"],
  tight: ["AA","KK","QQ","JJ","TT","99","88","AKs","AQs","AJs","ATs","KQs","KJs","QJs","JTs","AKo","AQo","AJo","KQo"],
  medium: ["AA","KK","QQ","JJ","TT","99","88","77","66","AKs","AQs","AJs","ATs","A9s","A8s","A5s","A4s","KQs","KJs","KTs","QJs","QTs","JTs","T9s","98s","87s","AKo","AQo","AJo","ATo","KQo","KJo","QJo"],
  wide: ["AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33","22","AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s","KQs","KJs","KTs","K9s","K8s","QJs","QTs","Q9s","JTs","J9s","T9s","T8s","98s","97s","87s","76s","65s","54s","AKo","AQo","AJo","ATo","A9o","KQo","KJo","KTo","QJo","QTo","JTo"],
  veryWide: ["AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33","22","AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s","KQs","KJs","KTs","K9s","K8s","K7s","K6s","K5s","K4s","QJs","QTs","Q9s","Q8s","Q7s","JTs","J9s","J8s","J7s","T9s","T8s","T7s","98s","97s","96s","87s","86s","76s","75s","65s","64s","54s","53s","43s","AKo","AQo","AJo","ATo","A9o","A8o","A7o","A6o","A5o","KQo","KJo","KTo","K9o","K8o","QJo","QTo","Q9o","JTo","J9o","T9o"]
};

const mixTemplates = {
  tight: ["77","A9s","A5s","A4s","KTs","QTs","T9s","98s","KJo","QJo"],
  medium: ["55","44","33","22","A7s","A6s","A3s","A2s","K9s","Q9s","J9s","T8s","97s","76s","65s","A9o","KTo","QTo","JTo"],
  wide: ["K7s","K6s","K5s","Q8s","J8s","T7s","96s","86s","75s","64s","53s","A8o","A7o","A6o","A5o","K9o","Q9o","J9o","T9o"]
};

const value3bet = ["AA","KK","QQ","JJ","TT","AKs","AQs","AJs","KQs","AKo","AQo"];
const bluff3bet = ["A5s","A4s","A3s","A2s","KTs","QTs","JTs","T9s","98s"];
const fourBetValue = ["AA","KK","QQ","AKs","AKo"];
const fourBetMix = ["JJ","TT","AQs","A5s","A4s"];

function handAt(row, col) {
  const a = ranks[row], b = ranks[col];
  if (row === col) return `${a}${b}`;
  return row < col ? `${a}${b}s` : `${b}${a}o`;
}

function positionStage(position) {
  if (["UTG","UTG+1","UTG+2","LJ"].includes(position)) return "early";
  if (["HJ","CO"].includes(position)) return "middle";
  if (["BTN","SB"].includes(position)) return "late";
  return "blind";
}

function rfiTier(position, format) {
  const stage = positionStage(position);
  if (stage === "early") return "tight";
  if (position === "HJ") return "medium";
  if (position === "CO") return "wide";
  if (position === "BTN" || position === "SB") return "veryWide";
  if (format.includes("9") && ["UTG","UTG+1"].includes(position)) return "veryTight";
  return "medium";
}

function stackCategory(bb) {
  const n = Number(bb);
  if (n <= 8) return "tiny";
  if (n <= 15) return "short";
  if (n <= 30) return "medium";
  if (n <= 60) return "deepish";
  return "deep";
}

function getRange({ format, heroPos, villainPos, scenario, stackBB, villainCount }) {
  const stack = stackCategory(stackBB);
  let primary = [], secondary = [], note = "", title = "";

  if (scenario === "Unopened Pot / RFI") {
    const tier = rfiTier(heroPos, format);
    primary = rangeTemplates[tier];
    secondary = mixTemplates[tier === "veryWide" ? "wide" : tier === "wide" ? "medium" : "tight"] || [];
    title = `${heroPos} RFI baseline`;
    note = "Open tighter early and wider from CO/BTN/SB. Reduce marginal opens if short-stacked, facing aggressive players, or in high-rake cash games.";
  }

  if (scenario === "Facing Open") {
    const villainLate = ["CO","BTN","SB"].includes(villainPos);
    primary = villainLate ? ["AA","KK","QQ","JJ","TT","99","AKs","AQs","AJs","KQs","AKo","AQo","AJo","KQo"] : ["AA","KK","QQ","JJ","TT","AKs","AQs","AKo","AQo"];
    secondary = villainLate ? ["88","77","A5s","A4s","ATs","KJs","KTs","QJs","QTs","JTs","T9s","98s","AJo","KJo"] : ["99","88","AJs","A5s","KQs","KJs","QJs","JTs"];
    title = `Continue vs ${villainPos} open`;
    note = "Continue wider versus late-position opens and tighter versus early-position opens. Prefer suited broadways, pairs, suited aces, and hands with playability.";
  }

  if (scenario === "Facing 3-Bet") {
    primary = ["AA","KK","QQ","JJ","AKs","AKo","AQs"];
    secondary = ["TT","99","AJs","ATs","A5s","A4s","KQs","KJs","QJs","JTs","AQo"];
    title = "Facing 3-bet";
    note = "Default: continue with strong pairs, AK/AQ, suited broadways, and some suited wheel aces. Tighten out of position and against large 3-bets.";
  }

  if (scenario === "Facing 4-Bet") {
    primary = fourBetValue;
    secondary = fourBetMix;
    title = "Facing 4-bet";
    note = "Very tight node. Continue mostly with premiums. Stack depth and opponent type matter heavily.";
  }

  if (scenario === "Short Stack Open Jam") {
    if (stack === "tiny") {
      primary = rangeTemplates.veryWide;
      secondary = mixTemplates.wide;
    } else if (stack === "short") {
      primary = heroPos === "BTN" || heroPos === "SB" ? rangeTemplates.wide : rangeTemplates.medium;
      secondary = heroPos === "BTN" || heroPos === "SB" ? mixTemplates.wide : mixTemplates.medium;
    } else {
      primary = rangeTemplates.tight;
      secondary = mixTemplates.tight;
    }
    title = `${stackBB}bb open-jam study range`;
    note = "Short-stack push/fold spots are highly sensitive to antes, payout pressure, bounty value, and players left to act. Use as study baseline only.";
  }

  if (scenario === "Facing Jam") {
    if (stack === "tiny") {
      primary = ["AA","KK","QQ","JJ","TT","99","88","77","AKs","AQs","AJs","ATs","KQs","AKo","AQo","AJo","KQo"];
      secondary = ["66","55","A9s","A8s","A5s","KJs","KTs","QJs","QTs","JTs","ATo","KJo"];
    } else {
      primary = ["AA","KK","QQ","JJ","TT","AKs","AQs","AKo","AQo"];
      secondary = ["99","88","AJs","A5s","KQs","KJs","QJs"];
    }
    title = `Call jam at ${stackBB}bb`;
    note = "Calling jams should be tighter than jamming first-in because you lose fold equity. ICM/bounties can change this drastically.";
  }

  if (scenario === "BB Defense") {
    primary = ["AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33","22","AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","KQs","KJs","KTs","K9s","QJs","QTs","Q9s","JTs","J9s","T9s","98s","87s","AQo","AJo","KQo","KJo","QJo"];
    secondary = ["A3s","A2s","K8s","K7s","Q8s","J8s","T8s","97s","86s","76s","75s","65s","54s","ATo","KTo","QTo","JTo"];
    title = "BB defense";
    note = "BB defends wider due to price, but rake and sizing matter. Defend more versus small late opens and less versus early-position/large opens.";
  }

  if (Number(villainCount) >= 2 || villainCount === "3+") {
    note += " Multiway pressure: remove dominated offsuit hands and weak suited trash; prefer nutted, suited, connected, and pocket-pair hands.";
    secondary = secondary.filter(h => h.includes("s") || h[0] === h[1]);
  }

  return { primary, secondary, title, note };
}

function classify(hand, range) {
  if (range.primary.includes(hand)) return "primary";
  if (range.secondary.includes(hand)) return "secondary";
  return "fold";
}

function actionLabel(cls, scenario) {
  if (cls === "fold") return "Fold / usually avoid";
  if (scenario.includes("Facing")) return cls === "primary" ? "Continue strongly" : "Mixed / cautious continue";
  if (scenario.includes("Jam")) return cls === "primary" ? "Jam / call candidate" : "Borderline / mix";
  if (scenario === "BB Defense") return cls === "primary" ? "Defend" : "Borderline defend";
  return cls === "primary" ? "Open / raise" : "Mixed / optional";
}

function App() {
  const [format, setFormat] = useState("Tournament 8-Handed");
  const [heroPos, setHeroPos] = useState("LJ");
  const [villainPos, setVillainPos] = useState("HJ");
  const [scenario, setScenario] = useState("Unopened Pot / RFI");
  const [stackBB, setStackBB] = useState("25");
  const [villainCount, setVillainCount] = useState("1");
  const [selectedHand, setSelectedHand] = useState(null);

  const positions = positionsByFormat[format];
  const range = useMemo(() => getRange({ format, heroPos, villainPos, scenario, stackBB, villainCount }), [format, heroPos, villainPos, scenario, stackBB, villainCount]);
  const selectedClass = selectedHand ? classify(selectedHand, range) : null;
  const totalHands = range.primary.length + range.secondary.length;

  function changeFormat(next) {
    setFormat(next);
    const newPositions = positionsByFormat[next];
    if (!newPositions.includes(heroPos)) setHeroPos(newPositions[0]);
    if (!newPositions.includes(villainPos)) setVillainPos(newPositions[1] || newPositions[0]);
  }

  return (
    <div className="app">
      <main className="container">
        <section className="hero">
          <div>
            <p className="eyebrow">Study reference · not RTA</p>
            <h1>Poker Decision Reference</h1>
            <p className="sub">Fast preflop scenario viewer for cash and tournament study.</p>
          </div>
          <div className="heroIcon"><Trophy size={24}/></div>
        </section>

        <section className="warning">
          <ShieldAlert size={18}/>
          <p>Use only where allowed. Many online sites prohibit real-time assistance during active hands.</p>
        </section>

        <section className="panel">
          <div className="field full">
            <label>Game</label>
            <select value={format} onChange={e => changeFormat(e.target.value)}>
              {Object.keys(positionsByFormat).map(x => <option key={x}>{x}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Hero Position</label>
            <select value={heroPos} onChange={e => setHeroPos(e.target.value)}>
              {positions.map(x => <option key={x}>{x}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Villain Position</label>
            <select value={villainPos} onChange={e => setVillainPos(e.target.value)}>
              {positions.map(x => <option key={x}>{x}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Scenario</label>
            <select value={scenario} onChange={e => setScenario(e.target.value)}>
              {scenarios.map(x => <option key={x}>{x}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Villains In Pot</label>
            <select value={villainCount} onChange={e => setVillainCount(e.target.value)}>
              {villainCounts.map(x => <option key={x}>{x}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Stack BB</label>
            <select value={stackBB} onChange={e => setStackBB(e.target.value)}>
              {stackOptions.map(x => <option key={x}>{x}bb</option>)}
            </select>
          </div>
        </section>

        <section className="stats">
          <div><Target size={17}/><span>{totalHands}/169 hands</span></div>
          <div><Layers size={17}/><span>{format}</span></div>
          <div><Sparkles size={17}/><span>{scenario}</span></div>
        </section>

        <section className="legend">
          <span><i className="primary"></i>Main continue</span>
          <span><i className="secondary"></i>Mixed / borderline</span>
          <span><i className="fold"></i>Fold</span>
        </section>

        <section className="gridCard">
          <div className="handGrid">
            {ranks.map((_, r) => ranks.map((_, c) => {
              const hand = handAt(r,c);
              const cls = classify(hand, range);
              return <button key={hand} className={`hand ${cls} ${selectedHand === hand ? "selected" : ""}`} onClick={() => setSelectedHand(hand)}>{hand}</button>
            }))}
          </div>
        </section>

        <section className="infoCard">
          <div className="infoTop">
            <BookOpen size={19}/>
            <div>
              <h2>{selectedHand || range.title}</h2>
              <p>{selectedHand ? actionLabel(selectedClass, scenario) : range.note}</p>
            </div>
          </div>
          <div className="sourceBox">
            <p><strong>Source model:</strong> original simplified ranges informed by public preflop theory, push/fold/Nash concepts, and common solver-derived range morphology. Not copied from paid chart products and not exact solver output.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
