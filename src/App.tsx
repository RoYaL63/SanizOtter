import { useMemo, useRef, useState } from "react";
import { addManualDetection, categories, categoryLabels, deanonymizeText, detectSensitiveData, sanitizeText } from "./anonymizer";
import type { CustomRule, Detection, SensitiveCategory, SessionMapping } from "./types";

const sampleText = "Bonjour, je suis Marie DUPONT. Mon email est marie.dupont@example.com et mon telephone est 06 12 34 56 78. Mon SIRET est 552 100 554 00013.";
const makeRule = (): CustomRule => ({ id: crypto.randomUUID(), label: "Nouvelle regle", pattern: "", category: "CUSTOM", isRegex: false });
const sourceLabel: Record<Detection["source"], string> = { auto: "Auto", "custom-rule": "Regle", manual: "Manuel" };

function App() {
  const [text, setText] = useState(sampleText);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [sanitizedText, setSanitizedText] = useState("");
  const [aiText, setAiText] = useState("");
  const [restoredText, setRestoredText] = useState("");
  const [unknownPlaceholders, setUnknownPlaceholders] = useState<string[]>([]);
  const [rules, setRules] = useState<CustomRule[]>([makeRule()]);
  const [manualCategory, setManualCategory] = useState<SensitiveCategory>("CUSTOM");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lastSession, setLastSession] = useState<SessionMapping | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeCount = detections.filter((detection) => detection.status !== "ignored").length;
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
  const generate = (review: boolean) => commit(detectSensitiveData(text, rules, review ? "pending" : "accepted"));
  const resetSession = () => { setDetections([]); setSanitizedText(""); setAiText(""); setRestoredText(""); setUnknownPlaceholders([]); setLastSession(null); };
  const updateDetection = (id: string, patch: Partial<Detection>) => commit(detections.map((detection) => detection.id === id ? { ...detection, ...patch } : detection));
  const addSelection = () => {
    const input = inputRef.current;
    if (!input || input.selectionStart === input.selectionEnd) return;
    commit(addManualDetection(detections, text, input.selectionStart, input.selectionEnd, manualCategory));
  };
  const restore = () => { const result = deanonymizeText(aiText, detections); setRestoredText(result.restored); setUnknownPlaceholders(result.unknownPlaceholders); };
  const copy = async (value: string) => { if (value) await navigator.clipboard.writeText(value); };

  return <main className={"app " + theme}>
    <nav className="nav glass">
      <div className="brand"><span className="brandMark">SO</span><div><p className="eyebrow">SanizOtter</p><h1>Sanitizer local pour textes sensibles</h1></div></div>
      <div className="navActions"><button className="iconButton" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? "Nuit" : "Jour"}</button><button className="softButton" onClick={resetSession}>Reinitialiser</button></div>
    </nav>

    <section className="heroBand">
      <div><p className="eyebrow">Workflow prive</p><h2>Remplace les donnees sensibles par des balises, travaille avec l IA, puis restaure localement.</h2></div>
      <div className="heroStats"><span>{activeCount} balises</span><span>{Object.keys(groupedCounts).length} categories</span><span>{lastSession ? "Session active" : "Session vide"}</span></div>
    </section>

    <section className="workspace">
      <article className="panel inputPanel">
        <div className="panelHeader"><div><p className="eyebrow">01 - Source</p><h2>Texte original</h2></div><div className="modeButtons"><button className="primaryButton" onClick={() => generate(false)}>Rapide</button><button className="softButton" onClick={() => generate(true)}>Revision</button></div></div>
        <textarea ref={inputRef} className="textArea" value={text} onChange={(event) => { setText(event.target.value); resetSession(); }} spellCheck={false} />
        <div className="manualBar"><select value={manualCategory} onChange={(event) => setManualCategory(event.target.value as SensitiveCategory)}>{categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select><button className="softButton" onClick={addSelection}>Baliser la selection</button></div>
      </article>

      <article className="panel outputPanel">
        <div className="panelHeader"><div><p className="eyebrow">02 - Sortie</p><h2>Texte anonymise</h2></div><button className="primaryButton" onClick={() => copy(sanitizedText)}>Copier</button></div>
        <textarea className="textArea output" value={sanitizedText} readOnly placeholder="Le texte sanitise apparaitra ici." />
        <div className="chips"><span>{activeCount} balises actives</span>{Object.entries(groupedCounts).map(([category, count]) => <span key={category}>{category} - {count}</span>)}</div>
      </article>

      <article className="panel restorePanel">
        <div className="panelHeader"><div><p className="eyebrow">03 - Retour IA</p><h2>Desanonymisation</h2></div><button className="primaryButton" onClick={restore}>Restaurer</button></div>
        <textarea className="textArea half" value={aiText} onChange={(event) => setAiText(event.target.value)} placeholder="Colle ici la reponse de l IA avec les balises." />
        <textarea className="textArea half output" value={restoredText} readOnly placeholder="Le texte restaure apparaitra ici." />
        {unknownPlaceholders.length > 0 && <p className="warning">Balises inconnues conservees : {unknownPlaceholders.join(", ")}</p>}
      </article>
    </section>

    <section className="lowerGrid">
      <article className="panel rulesPanel"><div className="panelHeader"><div><p className="eyebrow">Regles</p><h2>Variables personnalisees</h2></div><button className="softButton" onClick={() => setRules([...rules, makeRule()])}>Ajouter</button></div>
        <div className="rules">{rules.map((rule) => <div className="ruleRow" key={rule.id}><input value={rule.label} onChange={(event) => setRules(rules.map((item) => item.id === rule.id ? { ...item, label: event.target.value } : item))} aria-label="Nom de regle" /><input value={rule.pattern} onChange={(event) => setRules(rules.map((item) => item.id === rule.id ? { ...item, pattern: event.target.value } : item))} placeholder="Cle API, SIRET, fragment exact ou regex" aria-label="Motif" /><select value={rule.category} onChange={(event) => setRules(rules.map((item) => item.id === rule.id ? { ...item, category: event.target.value as SensitiveCategory } : item))}>{categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select><label className="toggle"><input type="checkbox" checked={rule.isRegex} onChange={(event) => setRules(rules.map((item) => item.id === rule.id ? { ...item, isRegex: event.target.checked } : item))} />Regex</label></div>)}</div>
      </article>

      <article className="panel tablePanel"><div className="panelHeader"><div><p className="eyebrow">Table locale</p><h2>Correspondances de session</h2></div><p className="sessionStamp">{lastSession ? new Date(lastSession.createdAt).toLocaleTimeString("fr-FR") : "Aucune session"}</p></div>
        <div className="tableWrap"><table><thead><tr><th>Balise</th><th>Valeur</th><th>Categorie</th><th>Source</th><th>Etat</th></tr></thead><tbody>{detections.map((detection) => <tr key={detection.id}><td><code>{detection.placeholder}</code></td><td>{detection.original}</td><td><select value={detection.category} onChange={(event) => updateDetection(detection.id, { category: event.target.value as SensitiveCategory })}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></td><td>{sourceLabel[detection.source]}</td><td><select value={detection.status} onChange={(event) => updateDetection(detection.id, { status: event.target.value as Detection["status"] })}><option value="pending">A verifier</option><option value="accepted">Valide</option><option value="ignored">Ignore</option></select></td></tr>)}{detections.length === 0 && <tr><td colSpan={5} className="empty">Aucune detection pour le moment.</td></tr>}</tbody></table></div>
      </article>
    </section>
  </main>;
}

export default App;
