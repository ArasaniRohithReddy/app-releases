# Microsoft Threat Modeling Tool compatibility

Threat Model Reviewer complements Microsoft Threat Modeling Tool (TMT). It helps
prepare a model for human review; it is not a replacement for every TMT feature,
a Microsoft approval service, or a tool that patches application code.

## Supported workflows and boundaries

| Workflow | What this application provides | Boundary to retain |
| --- | --- | --- |
| Review an existing `.tm7` | Reads model structure and threats, then applies the deterministic rubric | The score measures the model, not deployed security or Microsoft acceptance |
| Correct a model | Previews selected changes and writes a corrected `.tm7` | Inspect changes and retain the original; a proposed mitigation is not implementation evidence |
| Draft a model | Create/Assistant and CLI authoring produce components, flows and deterministic STRIDE threats | New threats require human triage; this is not a reproduction of every native template's threat catalog |
| Generate for native TMT | The supported baseline/template workflow carries the model's knowledge base and profile | A file that parses in this reviewer is not, by itself, proof that an arbitrary TMT template can open it |
| Work with a diagram | Selection, element/flow editing, layout, zoom and reviewed Copilot proposals | Layout and artwork are not claimed to be pixel-identical to native TMT |
| Compare and hand off work | Saved-revision comparison, reports, work items and evidence bundles | A comparison describes model changes; it does not prove that controls were deployed |
| Customize organization policy | CLI policy validation, overrides and disclosed waivers over the existing rubric | This does not load arbitrary checks into the desktop app or replace TMT's template editor |

Microsoft's [feature overview](https://learn.microsoft.com/azure/security/develop/threat-modeling-tool-feature-overview)
also describes native template editing, diagram management, analysis views and
OneDrive sharing. Those capabilities must not be inferred from this application's
ability to read or write `.tm7` files. Use the native tool for workflows that are
not exposed here.

## Compatibility evidence

Native serializer evidence is scoped to **Microsoft TMT 7.3.51110.1** and the
**Azure Cloud Services** template used by the compatibility fixtures. Microsoft
lists that TMT version in its [release history](https://learn.microsoft.com/azure/security/develop/threat-modeling-tool-releases).
These references were checked on **2026-09-14**; they do not establish compatibility
with every past, future or organization-customized template.

The installed Microsoft serializer checks read, save and reload generated models,
including retained knowledge base/profile, canonical states and GUIDs, unique
native threat keys, element/flow identities, security properties and evidence
counts. Rich metadata, Azure-derived structure and a neutral HTTP-flow example
are covered. This is stronger than checking output only with this application's
parser, but narrower than a complete native-dashboard UI acceptance exercise.

Full native TMT UI automation is not claimed. TMT can update itself and its
templates, and its native profile is separate from this application's settings.
Use an isolated Windows environment for native UI acceptance rather than letting
an automated check modify a developer's normal TMT profile.

## Diagram artwork and matching

Microsoft's stencil images are **not redistributed** in the application bundles.
When a local TMT installation is available, the application reads its knowledge
bases and caches the extracted artwork under
`%LOCALAPPDATA%\ThreatModelReviewer\Stencils`.

Stencil resolution tries an exact type ID, normalized type name, curated aliases,
friendly names and a generic family. These are progressively weaker matches, not
equivalent assertions of identity. A renamed or unfamiliar service can fall back
to a generic representation. Small legacy glyphs, generic artwork, unavailable
images and unmatched stencils use the application's built-in vector icons.

The diagram deliberately remains a light document in both application themes.
Inspect the element's type and properties as well as its label; an icon match does
not establish which Azure service is deployed or how it is configured.

## Before handing a model to a reviewer

1. Keep the original file and review the selected changes before saving.
2. For generated files intended for TMT, use the supported baseline/template
   workflow described in the [user guide](USER-GUIDE.md), rather than assuming
   that generic XML generation is sufficient.
3. Open the resulting file in your team's target TMT version/template, inspect
   the diagram and threat records, and retain the accompanying evidence files.
4. Supply assumptions, unresolved threats and verification evidence for controls
   implemented by the owning team. **READY WITH NOTES is not Microsoft approval.**

See [Azure discovery](AZURE-DISCOVERY.md) for the distinction between permission
and observed traffic, [Compare](COMPARISON.md) for matching limitations, and
[data handling](DATA-HANDLING.md) before sending private inputs to an AI provider.
