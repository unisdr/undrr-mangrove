/** Authored, trusted specimens. This pattern does not sanitise HTML. */
export const EDITORIAL_HTML = `
<h1>Planning for resilient communities</h1>
<p>Use local evidence alongside the <a href="https://www.undrr.org/implementing-sendai-framework/what-sendai-framework">Sendai Framework</a>. A link remains recognisable without relying on colour.</p>
<div><section>
<h2>Understand the risk</h2>
<p>Start with <strong>people and places</strong>, and distinguish <em>risk</em> from the hazard itself. Record terms in a <code>risk_register</code>.</p>
<ul><li>Review <a href="https://www.undrr.org/terminology">agreed terminology</a>.<ul><li>Identify exposed people and infrastructure.</li><li>Record uncertainty.</li></ul></li><li>Use evidence that communities can access.</li></ul>
<h3>Choose actions</h3>
<ol><li>Agree priorities with communities.</li><li>Review actions after each event.</li></ol>
<dl><dt>Exposure</dt><dd>People and assets located in hazard-prone areas.</dd></dl>
</section></div>
<blockquote><p>Disaster risk reduction requires an all-of-society engagement and partnership.</p><footer>Source: <cite><a href="https://www.undrr.org/publication/sendai-framework-disaster-risk-reduction-2015-2030">Sendai Framework for Disaster Risk Reduction 2015–2030</a></cite>.</footer></blockquote>
<p>Use <cite>Global Assessment Report</cite> as a work title, rather than marking a person's name as a citation.</p>
<hr>
<figure><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='240'%3E%3Crect width='800' height='240' fill='%23d9e7ed'/%3E%3Cpath d='M0 200L180 60L400 170L600 30L800 130' fill='none' stroke='%23004f91' stroke-width='6'/%3E%3C/svg%3E" alt="Illustrative rising and falling line; no measured data is represented."><figcaption>Illustration only. Read the <a href="https://www.undrr.org/gar">assessment report</a> for evidence.</figcaption></figure>
<table><caption>Example review schedule</caption><thead><tr><th scope="col">Activity</th><th scope="col">Frequency</th></tr></thead><tbody><tr><th scope="row">Risk review</th><td>Annually</td></tr><tr><th scope="row">Community consultation</th><td>Before each plan update</td></tr></tbody></table>
<p>For literal technical examples, preserve spaces in <code>code</code> and provide keyboard access when a block genuinely overflows.</p>
<pre tabindex="0" role="region" aria-label="Scrollable code example"><code>const action = { area: 'community', priority: 'risk reduction', status: 'pending local review' };</code></pre>
<div class="mg-content__scroll" tabindex="0" role="region" aria-labelledby="rich-wide-caption"><table style="min-width: 48rem"><caption id="rich-wide-caption">Wide example: review responsibilities</caption><thead><tr><th scope="col">Action</th><th scope="col">Community representatives</th><th scope="col">Local government</th><th scope="col">Technical partners</th></tr></thead><tbody><tr><th scope="row">Review evidence</th><td>Check lived experience</td><td>Coordinate access</td><td>Explain uncertainty</td></tr></tbody></table></div>`;

export const CLASSED_PROSE_HTML =
  '<div class="cms-layout"><p class="text-align-center">A <a class="editorial-reference" href="https://www.undrr.org/gar">classed editorial reference</a> retains its existing paragraph-link cue.</p></div>';
