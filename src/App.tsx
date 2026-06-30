import { useEffect, useMemo, useRef, useState } from "react";
import { addManualDetection, categories, categoryLabels, deanonymizeText, detectSensitiveData, sanitizeText } from "./anonymizer";
import type { CustomRule, Detection, SensitiveCategory, SessionMapping } from "./types";

const RULE_STORAGE_KEY = "sanizotter.customRules.v1";
const sampleText = "Augustin Maillet\naugustin@example.com\n06 12 34 56 78";
const sourceLabel: Record<Detection["source"], string> = { auto: "Auto", "custom-rule": "Regle", manual: "Manuel" };

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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem(RULE_STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

  const activeCount = detections.filter((detection) => detection.status !== "ignored").length;
  const reusableRuleCount = rules.filter((rule) => rule.pattern.trim()).length;
  const groupedCounts = useMemo(() => detections.reduce<Record<string, number>>((acc, detection) => {
    if (detection.status !== "ignored") acc[detection.category] = (acc[detection.category] ?? 0) + 1;
    return acc;
  }, {}), [detections]);

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
      <div className="brand"><img className="brandLogo" src="/sanizotter-logo.png" alt="SanizOtter" /><div><p className="eyebrow">SanizOtter</p><h1>Sanitizer local pour textes sensibles</h1></div></div>
      <div className="navActions">
        <button className="iconButton" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? "Nuit" : "Jour"}</button>
        <button className="softButton" onClick={resetSession}>Vider la session</button>
        <button className="dangerButton" onClick={purgeArtifact}>Purger tout</button>
      </div>
    </nav>

    <section className="heroBand">
      <div className="heroCopy"><p className="eyebrow">Traitement local sans IA</p><h2>Colle un texte, anonymise les donnees sensibles, puis restaure les balises quand tu as fini.</h2><div className="heroStats"><span>{activeCount} balises</span><span>{Object.keys(groupedCounts).length} categories</span><span>{reusableRuleCount} regles sauvegardees</span></div></div>
      <img className="heroMascot" src="/sanizotter-logo.png" alt="Mascotte SanizOtter" />
    </section>

    <section className="guideSteps">
      <article><strong>1. Coller</strong><span>Ajoute ton texte sensible dans la zone source.</span></article>
      <article><strong>2. Anonymiser</strong><span>SanizOtter remplace localement noms, emails, numeros et secrets.</span></article>
      <article><strong>3. Copier</strong><span>Utilise le texte anonymise, puis restaure les balises au retour.</span></article>
    </section>

    <section className="workspace">
      <article className="panel inputPanel">
        <div className="panelHeader"><div><p className="eyebrow">01 - Source</p><h2>Texte a anonymiser</h2></div></div>
        <textarea ref={inputRef} className="textArea" value={text} onChange={(event) => { setText(event.target.value); resetSession(); }} spellCheck={false} placeholder="Colle ici le texte a traiter localement." />
        <button className="primaryButton mainAction" onClick={anonymize}>Anonymiser le texte</button>
        <details className="advancedBlock">
          <summary>Options avancees</summary>
          <div className="manualBar"><span>Si une valeur manque, selectionne-la dans le texte puis choisis sa categorie.</span><select value={manualCategory} onChange={(event) => setManualCategory(event.target.value as SensitiveCategory)}>{categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select><button className="softButton" onClick={addSelection}>Baliser la selection</button></div>
        </details>
      </article>

      <article className="panel outputPanel">
        <div className="panelHeader"><div><p className="eyebrow">02 - Sortie</p><h2>Texte anonymise</h2></div><button className="primaryButton" onClick={() => copy(sanitizedText)}>Copier</button></div>
        <textarea className="textArea output" value={sanitizedText} readOnly placeholder="Le texte anonymise apparaitra ici." />
        <div className="chips"><span>{activeCount} balises actives</span>{Object.entries(groupedCounts).map(([category, count]) => <span key={category}>{category} - {count}</span>)}</div>
      </article>

      <article className="panel restorePanel">
        <div className="panelHeader"><div><p className="eyebrow">03 - Restaurer</p><h2>Texte avec vraies valeurs</h2></div><button className="primaryButton" onClick={restore}>Restaurer</button></div>
        <textarea className="textArea half" value={aiText} onChange={(event) => setAiText(event.target.value)} placeholder="Colle ici un texte contenant les balises {{...}}." />
        <textarea className="textArea half output" value={restoredText} readOnly placeholder="Le texte restaure apparaitra ici." />
        {unknownPlaceholders.length > 0 && <p className="warning">Balises inconnues conservees : {unknownPlaceholders.join(", ")}</p>}
      </article>
    </section>

    <section className="lowerGrid">
      <article className="panel rulesPanel"><div className="panelHeader"><div><p className="eyebrow">Regles reutilisables</p><h2>Bibliotheque locale</h2></div><button className="softButton" onClick={() => setRules([...rules, makeRule()])}>Ajouter une regle</button></div>
        <p className="helperText">Sauvegarde ici les secrets metier, codes client ou expressions que tu veux reutiliser. Ces regles restent uniquement dans le stockage local de cette app.</p>
        <div className="rules">{rules.map((rule, index) => <div className="ruleCard" key={rule.id}>
          <div className="ruleTop"><span>Regle {index + 1}</span><div><button className="miniButton" onClick={() => duplicateRule(rule)}>Dupliquer</button><button className="miniButton" onClick={() => removeRule(rule.id)}>Supprimer</button></div></div>
          <label>Nom lisible<input value={rule.label} onChange={(event) => updateRule(rule.id, { label: event.target.value })} placeholder="Ex : Cle Stripe prod" /></label>
          <label>Texte ou motif a detecter<input value={rule.pattern} onChange={(event) => updateRule(rule.id, { pattern: event.target.value })} placeholder="sk_live_..., client-42, SIRET exact" /></label>
          <div className="ruleMeta"><label>Categorie<select value={rule.category} onChange={(event) => updateRule(rule.id, { category: event.target.value as SensitiveCategory })}>{categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select></label><label className="toggle"><input type="checkbox" checked={rule.isRegex} onChange={(event) => updateRule(rule.id, { isRegex: event.target.checked })} />Regex</label></div>
        </div>)}</div>
      </article>

      <article className="panel tablePanel"><div className="panelHeader"><div><p className="eyebrow">Verification</p><h2>Balises trouvees</h2></div><p className="sessionStamp">{lastSession ? new Date(lastSession.createdAt).toLocaleTimeString("fr-FR") : "Aucune session"}</p></div>
        <p className="helperText">Ici tu peux corriger une categorie ou ignorer une detection avant de copier le resultat.</p>
        <div className="tableWrap"><table><thead><tr><th>Balise</th><th>Valeur</th><th>Categorie</th><th>Source</th><th>Etat</th></tr></thead><tbody>{detections.map((detection) => <tr key={detection.id}><td><code>{detection.placeholder}</code></td><td>{detection.original}</td><td><select value={detection.category} onChange={(event) => updateDetection(detection.id, { category: event.target.value as SensitiveCategory })}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></td><td>{sourceLabel[detection.source]}</td><td><select value={detection.status} onChange={(event) => updateDetection(detection.id, { status: event.target.value as Detection["status"] })}><option value="pending">Actif</option><option value="accepted">Actif</option><option value="ignored">Ignore</option></select></td></tr>)}{detections.length === 0 && <tr><td colSpan={5} className="empty">Aucune detection pour le moment.</td></tr>}</tbody></table></div>
      </article>
    </section>

    <footer className="appFooter">
      <section className="privacyFooter"><p className="eyebrow">Garantie de fonctionnement</p><p><strong>Traitement local sans IA :</strong> SanizOtter utilise des regles locales, des motifs et des heuristiques texte. Les donnees collees restent dans cette fenetre. Aucun OCR distant, aucun appel serveur, aucune reutilisation externe.</p></section>
      <section className="supportFooter"><div><p className="eyebrow">Soutenir le projet</p><h2>Parrainages et formation no-code</h2></div><div className="referralGrid">{referralLinks.map((link) => <a key={link.name} href={link.url} target="_blank" rel="noreferrer" className="referralCard"><strong>{link.name}</strong><span>{link.description}</span></a>)}</div></section>
    </footer>
  </main>;
}

export default App;