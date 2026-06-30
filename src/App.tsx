import { useEffect, useRef, useState } from "react";
import { addManualDetection, categories, categoryLabels, deanonymizeText, detectSensitiveData, sanitizeText } from "./anonymizer";
import type { CustomRule, Detection, SensitiveCategory, SessionMapping } from "./types";

const RULE_STORAGE_KEY = "sanizotter.customRules.v1";
const sampleText = "Augustin Maillet\naugustin@example.com\n06 12 34 56 78";

const referralLinks = [
  { name: "Hostinger", url: "https://hostinger.fr/?REFERRALCODE=5QYMAILLEWXJ", description: "Hebergement web" },
  { name: "Lovable", url: "https://lovable.dev/invite/265ZPB4", description: "Creation d'apps IA" },
  { name: "Dreamflow", url: "https://dreamflow.app/?grsf=augustin-0dlzrd", description: "Visual AI Builder" },
  { name: "Wispr Flow", url: "https://wisprflow.ai/r?AUGUSTIN29", description: "Dictee vocale IA" },
  { name: "Comet", url: "https://www.perplexity.ai/browser/invite-ga", description: "Navigateur IA" },
  { name: "Ecole Cube", url: "https://ambassadeurs-cube.lovable.app/parrainage/79d87bb665ff870f3ee6b83d363318f3", description: "Formation No-Code" },
];

const makeRule = (overrides: Partial<CustomRule> = {}): CustomRule => ({
  id: crypto.randomUUID(),
  label: "Nouvelle regle",
  pattern: "",
  category: "CUSTOM",
  isRegex: false,
  ...overrides,
});

const loadStoredRules = () => {
  try {
    const raw = localStorage.getItem(RULE_STORAGE_KEY);
    if (!raw) return [makeRule()];
    const parsed = JSON.parse(raw) as CustomRule[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [makeRule()];
  } catch {
    return [makeRule()];
  }
};

function App() {
  const [text, setText] = useState(sampleText);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [sanitizedText, setSanitizedText] = useState("");
  const [aiText, setAiText] = useState("");
  const [restoredText, setRestoredText] = useState("");
  const [unknownPlaceholders, setUnknownPlaceholders] = useState<string[]>([]);
  const [rules, setRules] = useState<CustomRule[]>(loadStoredRules);
  const [manualCategory, setManualCategory] = useState<SensitiveCategory>("CUSTOM");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lastSession, setLastSession] = useState<SessionMapping | null>(null);
  const [modal, setModal] = useState<"support" | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem(RULE_STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setModal(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeCount = detections.filter((detection) => detection.status !== "ignored").length;

  const commit = (nextDetections: Detection[]) => {
    const nextSanitized = sanitizeText(text, nextDetections);
    setDetections(nextDetections);
    setSanitizedText(nextSanitized);
    setLastSession({ detections: nextDetections, sanitizedText: nextSanitized, createdAt: new Date().toISOString() });
  };

  const anonymize = () => commit(detectSensitiveData(text, rules, "pending"));
  const resetSession = () => {
    setDetections([]);
    setSanitizedText("");
    setAiText("");
    setRestoredText("");
    setUnknownPlaceholders([]);
    setLastSession(null);
  };
  const purgeArtifact = () => {
    localStorage.removeItem(RULE_STORAGE_KEY);
    setRules([makeRule()]);
    setText("");
    resetSession();
  };
  const updateDetection = (id: string, patch: Partial<Detection>) => commit(detections.map((detection) => detection.id === id ? { ...detection, ...patch } : detection));
  const updateRule = (id: string, patch: Partial<CustomRule>) => setRules(rules.map((rule) => rule.id === id ? { ...rule, ...patch } : rule));
  const duplicateRule = (rule: CustomRule) => setRules([...rules, makeRule({ label: rule.label + " copie", pattern: rule.pattern, category: rule.category, isRegex: rule.isRegex })]);
  const removeRule = (id: string) => setRules(rules.length === 1 ? [makeRule()] : rules.filter((rule) => rule.id !== id));
  const addSelection = () => {
    const input = inputRef.current;
    if (!input || input.selectionStart === input.selectionEnd) return;
    commit(addManualDetection(detections, text, input.selectionStart, input.selectionEnd, manualCategory));
  };
  const restore = () => {
    const result = deanonymizeText(aiText, detections);
    setRestoredText(result.restored);
    setUnknownPlaceholders(result.unknownPlaceholders);
  };
  const copy = async (value: string) => { if (value) await navigator.clipboard.writeText(value); };

  return <main className={"app " + theme}>
    <nav className="nav glass">
      <div className="brand"><img className="brandLogo" src="./sanizotter-logo.png" alt="SanizOtter" /><div><p className="eyebrow">SanizOtter</p><h1>Sanitizer local pour textes sensibles</h1></div></div>
      <div className="navActions">
        <button className="chipButton" onClick={() => setModal("support")} title="Soutenir le projet">Soutenir</button>
        <div className="themeSwitch" data-theme={theme} role="group" aria-label="Theme">
          <span className="themeSwitchPill" aria-hidden="true" />
          <button type="button" className={theme === "light" ? "active" : ""} aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Jour</button>
          <button type="button" className={theme === "dark" ? "active" : ""} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Nuit</button>
        </div>
        <button className="softButton" onClick={resetSession}>Vider</button>
        <button className="dangerButton" onClick={purgeArtifact}>Purger</button>
      </div>
    </nav>

    <section className="workspace">
      <article className="panel inputPanel">
        <div className="panelHeader"><div><p className="eyebrow">01 - Source</p><h2>Texte a anonymiser</h2></div></div>
        <textarea ref={inputRef} className="textArea" value={text} onChange={(event) => { setText(event.target.value); resetSession(); }} spellCheck={false} placeholder="Colle ici le texte a traiter localement." />
        <button className="primaryButton mainAction" onClick={anonymize}>Anonymiser le texte</button>
        <div className="advancedBlock">
          <p className="advancedTitle">Baliser a la main</p>
          <div className="manualBar"><span>Si une valeur manque, selectionne-la dans le texte puis choisis sa categorie.</span><select value={manualCategory} onChange={(event) => setManualCategory(event.target.value as SensitiveCategory)}>{categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select><button className="softButton" onClick={addSelection}>Baliser la selection</button></div>
        </div>
      </article>

      <article className="panel outputPanel">
        <div className="panelHeader"><div><p className="eyebrow">02 - Sortie</p><h2>Texte anonymise</h2></div><button className="primaryButton" onClick={() => copy(sanitizedText)}>Copier</button></div>
        <textarea className="textArea output" value={sanitizedText} readOnly placeholder="Le texte anonymise apparaitra ici." />
        <div className="tagRecapHead"><span className="eyebrow">Balises ({activeCount})</span>{detections.length > 0 && <span className="tagRecapHint">clic = ignorer / reactiver</span>}</div>
        <div className="tagRecap">{detections.length === 0
          ? <span className="tagEmpty">Les balises apparaitront ici apres anonymisation.</span>
          : detections.map((detection) => <button key={detection.id} type="button" className={"tagPill" + (detection.status === "ignored" ? " off" : "")} title={detection.status === "ignored" ? "Reactiver cette balise" : "Ignorer cette balise"} onClick={() => updateDetection(detection.id, { status: detection.status === "ignored" ? "accepted" : "ignored" })}><code>{detection.placeholder}</code><span>{detection.original}</span></button>)}</div>
      </article>

      <article className="panel restorePanel">
        <div className="panelHeader"><div><p className="eyebrow">03 - Restaurer</p><h2>Texte avec vraies valeurs</h2></div><button className="primaryButton" onClick={restore}>Restaurer</button></div>
        <textarea className="textArea half" value={aiText} onChange={(event) => setAiText(event.target.value)} placeholder="Colle ici un texte contenant les balises {{...}}." />
        <textarea className="textArea half output" value={restoredText} readOnly placeholder="Le texte restaure apparaitra ici." />
        {unknownPlaceholders.length > 0 && <p className="warning">Balises inconnues conservees : {unknownPlaceholders.join(", ")}</p>}
      </article>
    </section>

    <section className="rulesSection">
      <article className="panel">
        <div className="panelHeader"><div><p className="eyebrow">Regles reutilisables</p><h2>Mots et motifs personnalises</h2></div><button className="softButton" onClick={() => setRules([...rules, makeRule()])}>Ajouter une regle</button></div>
        <p className="helperText">Ajoute ici les secrets metier, codes client ou expressions que la detection automatique ne connait pas (cle Stripe, reference interne, nom de projet). Ces regles restent uniquement dans le stockage local de cette app et sont reappliquees a chaque anonymisation.</p>
        <div className="rules">{rules.map((rule, index) => <div className="ruleCard" key={rule.id}>
          <div className="ruleTop"><span>Regle {index + 1}</span><div><button className="miniButton" onClick={() => duplicateRule(rule)}>Dupliquer</button><button className="miniButton" onClick={() => removeRule(rule.id)}>Supprimer</button></div></div>
          <label>Nom lisible<input value={rule.label} onChange={(event) => updateRule(rule.id, { label: event.target.value })} placeholder="Ex : Cle Stripe prod" /></label>
          <label>Texte ou motif a detecter<input value={rule.pattern} onChange={(event) => updateRule(rule.id, { pattern: event.target.value })} placeholder={rule.isRegex ? "sk_[A-Za-z0-9_-]+" : "Texte exact, ex : client-42"} /></label>
          <div className="ruleMeta"><label>Categorie<select value={rule.category} onChange={(event) => updateRule(rule.id, { category: event.target.value as SensitiveCategory })}>{categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select></label><label className="toggle" title="Coche si ton motif est une expression reguliere (regex). La regex doit decrire TOUTE la valeur, pas juste le debut. Ex : sk_ ne trouve que ces 3 caracteres ; sk_[A-Za-z0-9_-]+ trouve la cle complete (sk_test_8f92...). Decoche : le texte est cherche exactement tel que tu l'ecris."><input type="checkbox" checked={rule.isRegex} onChange={(event) => updateRule(rule.id, { isRegex: event.target.checked })} />Regex<span className="infoDot" aria-hidden="true">i</span></label></div>
          <p className="ruleHint">{rule.isRegex ? "Mode regex (avance) : la regex doit couvrir toute la valeur. Ex : sk_[A-Za-z0-9_-]+ attrape la cle entiere, pas seulement sk_." : "Mode texte : SanizOtter cherche ce texte exactement, tel quel. Coche Regex pour les motifs variables (cles, references)."}</p>
        </div>)}</div>
      </article>
    </section>

    {modal && <div className="modalOverlay" onClick={() => setModal(null)}>
      <div className="modalCard panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modalHead">
          <h2>Soutenir le projet</h2>
          <button className="iconButton" onClick={() => setModal(null)}>Fermer</button>
        </div>
        <div className="modalBody">
          {modal === "support" && <>
            <p className="helperText"><strong>Traitement local sans IA :</strong> SanizOtter utilise des regles, motifs et heuristiques texte. Les donnees collees restent dans cette fenetre. Aucun OCR distant, aucun appel serveur.</p>
            <div className="referralGrid">{referralLinks.map((link) => <a key={link.name} href={link.url} target="_blank" rel="noreferrer" className="referralCard"><strong>{link.name}</strong><span>{link.description}</span></a>)}</div>
          </>}
        </div>
      </div>
    </div>}
  </main>;
}

export default App;