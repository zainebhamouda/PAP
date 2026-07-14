/**
 * ══════════════════════════════════════════════════════════════════
 *  CATALOGUE OFFICIEL DES DÉFAUTS — LEONI PI3010 Enclosure 3
 *  Rev: 09.2024 — "Product Audits – Defect List"
 *  Transcrit et vérifié directement depuis le PDF scanné (8 catégories,
 *  colonnes A→Z, un nombre de points par combinaison composant × code)
 * ══════════════════════════════════════════════════════════════════
 *
 * Structure : LEONI_DEFECT_CATEGORIES[]
 *   { id, label, components: [ { code, label, defauts: [{code,label,points}] } ] }
 *
 * "—" dans le PDF (non applicable) = simplement absent du tableau `defauts`.
 */

export const LEONI_DEFECT_CATEGORIES = [
  // ═══════════════════════════════════════════════════════════
  // 1 — CRIMP-CONNECTIONS
  // ═══════════════════════════════════════════════════════════
  {
    id: '1', label: 'Crimp-Connections',
    components: [
      {
        code: '1.1.1', label: 'Terminals (open crimp barrel) crimped on CU-wire',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Incorrect terminal / splice element',points:100},
          {code:'D',label:'Damaged / deformed',points:100},
          {code:'E',label:'Oxidized / tarnished',points:50},
          {code:'F',label:'No insulations end visible between wire- and insulation crimp',points:75},
          {code:'G',label:'Cut-off tab not acc. to specification',points:25},
          {code:'H',label:'Pull off force not acc. to specification',points:100},
          {code:'J',label:'Contamination / foreign material on/inside terminal',points:75},
          {code:'K',label:'Crimpheight /-width not acc. to specification',points:100},
          {code:'L',label:'Lateral cross section not acc. to specification',points:100},
          {code:'M',label:'Burr / flash not acc. to specification',points:50},
          {code:'N',label:'Crimped on insulation',points:100},
          {code:'O',label:'Crimp barrel seam not closed over its entire length',points:100},
          {code:'P',label:'Bell mouth on the rear end is missing',points:50},
          {code:'Q',label:'Single strands not completely crimped / protruding / cutted',points:100},
          {code:'R',label:'Conductor protrusion / projection not acc. to specification',points:50},
          {code:'S',label:'Number of strands not acc. to specification',points:100},
          {code:'T',label:'Position of splice not acc. to specification *',points:50},
          {code:'V',label:'Crimpheight /-width not acc. to specification (insulation)',points:75},
          {code:'W',label:'Wire insulation damaged *',points:50},
          {code:'X',label:'Insulation crimp type no acc. to specification',points:50},
          {code:'Z',label:'Double crimp not acc. to specification',points:50},
        ]
      },
      {
        code: '1.1.2', label: 'Terminals (closed crimp barrel) crimped on CU-wire',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Incorrect terminal / splice element',points:100},
          {code:'D',label:'Damaged / deformed',points:100},
          {code:'E',label:'Oxidized / tarnished',points:50},
          {code:'G',label:'Cut-off tab not acc. to specification',points:25},
          {code:'H',label:'Pull off force not acc. to specification',points:100},
          {code:'I',label:'Marking / embossing in screwing area',points:50},
          {code:'J',label:'Contamination / foreign material on/inside terminal',points:75},
          {code:'K',label:'Crimpheight /-width not acc. to specification',points:100},
          {code:'M',label:'Burr / flash not acc. to specification',points:50},
          {code:'N',label:'Crimped on insulation',points:100},
          {code:'O',label:'Crimp barrel seam not closed over its entire length',points:100},
          {code:'P',label:'Bell mouth on the rear end is missing',points:50},
          {code:'Q',label:'Single strands not completely crimped / protruding / cutted',points:100},
          {code:'R',label:'Conductor protrusion / projection not acc. to specification',points:50},
          {code:'Z',label:'Double crimp not acc. to specification',points:50},
        ]
      },
      {
        code: '1.1.3', label: 'Terminals (open crimp barrel) crimped on AL-wire',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Incorrect terminal / splice element',points:100},
          {code:'D',label:'Damaged / deformed',points:100},
          {code:'E',label:'Oxidized / tarnished',points:50},
          {code:'G',label:'Cut-off tab not acc. to specification',points:25},
          {code:'H',label:'Pull off force not acc. to specification',points:100},
          {code:'I',label:'Marking / embossing in screwing area',points:50},
          {code:'J',label:'Contamination / foreign material on/inside terminal',points:75},
          {code:'K',label:'Crimpheight /-width not acc. to specification',points:100},
          {code:'L',label:'Lateral cross section not acc. to specification',points:100},
          {code:'M',label:'Burr / flash not acc. to specification',points:50},
          {code:'N',label:'Crimped on insulation',points:100},
          {code:'Q',label:'Single strands not completely crimped / protruding / cutted',points:100},
          {code:'U',label:'Longitudinal cross section not acc. to specification',points:100},
        ]
      },
      {
        code: '1.1.4', label: 'Terminals (closed crimp barrel) crimped on AL-wire',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Incorrect terminal / splice element',points:100},
          {code:'D',label:'Damaged / deformed',points:100},
          {code:'E',label:'Oxidized / tarnished',points:50},
          {code:'G',label:'Cut-off tab not acc. to specification',points:25},
          {code:'H',label:'Pull off force not acc. to specification',points:100},
          {code:'I',label:'Marking / embossing in screwing area',points:50},
          {code:'J',label:'Contamination / foreign material on/inside terminal',points:75},
          {code:'K',label:'Crimpheight /-width not acc. to specification',points:100},
          {code:'L',label:'Lateral cross section not acc. to specification',points:100},
          {code:'M',label:'Burr / flash not acc. to specification',points:50},
          {code:'N',label:'Crimped on insulation',points:100},
          {code:'Q',label:'Single strands not completely crimped / protruding / cutted',points:100},
          {code:'U',label:'Longitudinal cross section not acc. to specification',points:100},
        ]
      },
      {
        code: '1.2', label: 'Connections / Splices — Crimped-/pressed connections wire-wire',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Incorrect terminal / splice element',points:100},
          {code:'D',label:'Damaged / deformed',points:100},
          {code:'E',label:'Oxidized / tarnished',points:50},
          {code:'F',label:'No insulations end visible between wire- and insulation crimp',points:75},
          {code:'G',label:'Cut-off tab not acc. to specification',points:25},
          {code:'H',label:'Pull off force not acc. to specification',points:100},
          {code:'J',label:'Contamination / foreign material on/inside terminal',points:75},
          {code:'K',label:'Crimpheight /-width not acc. to specification',points:100},
          {code:'L',label:'Lateral cross section not acc. to specification',points:100},
          {code:'M',label:'Burr / flash not acc. to specification',points:50},
          {code:'N',label:'Crimped on insulation',points:100},
          {code:'O',label:'Crimp barrel seam not closed over its entire length',points:100},
          {code:'P',label:'Bell mouth on the rear end is missing',points:50},
          {code:'Q',label:'Single strands not completely crimped / protruding / cutted',points:100},
          {code:'R',label:'Conductor protrusion / projection not acc. to specification',points:50},
          {code:'S',label:'Number of strands not acc. to specification',points:100},
          {code:'T',label:'Position of splice not acc. to specification *',points:50},
        ]
      },
      {
        code: '1.3.1', label: 'Welded joints (Ultrasonic, pressure, resistance welding) — Wire-wire (Splice)',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Welded joint damaged, broken',points:100},
          {code:'D',label:'Welded joint bent, deformed',points:75},
          {code:'F',label:'Strand(s) protruding, not welded, shifted outside of specification',points:75},
          {code:'L',label:'Min. peel- / pull-force not achieved',points:100},
          {code:'M',label:'Weld node not realised acc. to specification (parallel-/end splice, wire combinations/-quantity)',points:75},
          {code:'N',label:'Position of weld node not acc. to specification',points:50},
          {code:'P',label:'Distance between splice joints not acc. to specification',points:50},
          {code:'S',label:'Compaction (lateral cross section) not acc. to spec.',points:50},
        ]
      },
      {
        code: '1.3.2', label: 'Welded joints (Ultrasonic, pressure, resistance welding) — Terminal connector-wire',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Welded joint damaged, broken',points:100},
          {code:'D',label:'Welded joint bent, deformed',points:100},
          {code:'F',label:'Strand(s) protruding, not welded, shifted outside of specification',points:75},
          {code:'L',label:'Min. peel- / pull-force not achieved',points:100},
        ]
      },
      {
        code: '1.4', label: 'Soldered joints',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged',points:50},
        ]
      },
      {
        code: '1.5', label: 'Cut & Crimp-Technology (Cut-Crimp Connections)',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged',points:50},
          {code:'I',label:'Not latched, not locked',points:100},
          {code:'J',label:'Wire depth insertion n.o.k.',points:100},
          {code:'K',label:'Wire insertion to the end n.o.k.',points:100},
          {code:'L',label:'Axial pull off force n.o.k.',points:100},
          {code:'M',label:'Seal incorrectly fitted',points:75},
          {code:'N',label:'Insulation crimp not closed',points:75},
          {code:'O',label:'Crimped through insulation',points:50},
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 2 — CONNECTOR HOUSINGS
  // ═══════════════════════════════════════════════════════════
  {
    id: '2', label: 'Connector Housings',
    components: [
      {
        code: '2', label: 'Connector Housings (All variants / Dimensions)',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Assembly (connector / counterpart) not acc. to specification',points:50},
          {code:'D',label:'Damaged',points:75},
          {code:'E',label:'Terminal not locked',points:100},
          {code:'F',label:'Locking elements missing, damaged',points:100},
          {code:'G',label:'Secondary Lock missing',points:100},
          {code:'H',label:'Secondary Lock not latched / locked',points:100},
          {code:'I',label:'Secondary Lock damaged',points:75},
          {code:'J',label:'Connector housing not closed or latched',points:50},
          {code:'K',label:'Identification not acc. to specification',points:50},
          {code:'L',label:'Assembly locking not acc. to specification',points:25},
          {code:'M',label:'Wrong connector coding / part number',points:100},
          {code:'N',label:'Contamination / foreign material in/on connector',points:75},
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 3 — WIRES
  // ═══════════════════════════════════════════════════════════
  {
    id: '3', label: 'Wires',
    components: [
      {
        code: '3.1.1', label: 'Single Wires, twisted wires',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged, function affected **',points:100},
          {code:'D',label:'Damaged, without effect on function',points:50},
          {code:'E',label:'Wrong dimension',points:75},
          {code:'F',label:'Wrong orientation (X/Y-Axis)',points:75},
          {code:'G',label:'Bending radius too small / kinked',points:50},
          {code:'I',label:'Locking / assembly not acc. to specification',points:75},
          {code:'J',label:'Wire loop outside taping / corrugated tube or at connector housings',points:50},
          {code:'L',label:'Missing protective cap / connecting piece',points:100},
          {code:'M',label:'Wire cross section too small',points:25},
          {code:'N',label:'Identification not acc. to specification (color, imprint)',points:100},
          {code:'O',label:'Wires swapped (wrong cavity used)',points:100},
          {code:'P',label:'Stripped too short / long',points:25},
          {code:'Q',label:'Unclean cutting of insulation, insulation residues on the strands',points:100},
          {code:'R',label:'Single strands damaged (notched, scored, etc.)',points:75},
          {code:'S',label:'Twisted wires: Pitch not acc. to specification',points:50},
          {code:'T',label:'Twisted wires: Untwisted wire ends not acc. to specification',points:50},
        ]
      },
      {
        code: '3.1.2', label: 'Assembly wire harness / branches',
        defauts: [
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged, function affected **',points:100},
          {code:'D',label:'Damaged, without effect on function',points:50},
          {code:'E',label:'Wrong dimension',points:75},
          {code:'F',label:'Wrong orientation (X/Y-Axis)',points:100},
        ]
      },
      {
        code: '3.2', label: 'Water- / vacuum pipes',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged, function affected **',points:100},
          {code:'D',label:'Damaged, without effect on function',points:50},
          {code:'E',label:'Wrong dimension',points:100},
          {code:'F',label:'Wrong orientation (X/Y-Axis)',points:100},
          {code:'G',label:'Bending radius too small / kinked',points:75},
          {code:'I',label:'Wire loop outside taping / corrugated tube or at connector housings',points:100},
          {code:'K',label:'Missing protective cap / connecting piece',points:50},
          {code:'U',label:'Blocked',points:100},
        ]
      },
      {
        code: '3.3', label: 'Fibre optics cable, antenna / HF-cable',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged, function affected **',points:100},
          {code:'E',label:'Wrong dimension',points:100},
          {code:'F',label:'Wrong orientation (X/Y-Axis)',points:75},
          {code:'G',label:'Bending radius too small / kinked',points:100},
          {code:'H',label:'Locking / assembly not acc. to specification',points:100},
          {code:'I',label:'Wire loop outside taping / corrugated tube or at connector housings',points:100},
          {code:'J',label:'Wire under tension',points:75},
          {code:'K',label:'Missing protective cap / connecting piece',points:100},
          {code:'N',label:'Wires swapped (wrong cavity used)',points:100},
          {code:'T',label:'Sheated cable not processed acc. to specification',points:50},
        ]
      },
      {
        code: '3.4', label: 'Foil conductors',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged, function affected **',points:100},
          {code:'E',label:'Wrong dimension',points:100},
          {code:'F',label:'Wrong orientation (X/Y-Axis)',points:75},
          {code:'V',label:'Bubbles / kinks / discontinuous / wavy',points:100},
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 4 — SEALS / PLUG GROMMETS / SEALING
  // ═══════════════════════════════════════════════════════════
  {
    id: '4', label: 'Seals / Plug Grommets / Sealing',
    components: [
      {
        code: '4.1', label: 'Blind seals / blind plugs',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged with tightness affected',points:100},
          {code:'D',label:'Damaged / without leaking',points:50},
          {code:'E',label:'Assembly not acc. to specification (orientation)',points:50},
          {code:'H',label:'Position of the seal inside the connector no acc. to specification (plug in dimension)',points:50},
        ]
      },
      {
        code: '4.2', label: 'Radial- / single wire seals',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged with tightness affected',points:100},
          {code:'D',label:'Damaged / without leaking',points:50},
          {code:'E',label:'Assembly not acc. to specification (orientation)',points:50},
          {code:'I',label:'Single wire seal not fixed well inside insulation crimp',points:75},
        ]
      },
      {
        code: '4.3', label: 'Grommets',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged with tightness affected',points:100},
          {code:'D',label:'Damaged / without leaking',points:50},
          {code:'E',label:'Assembly not acc. to specification (orientation)',points:100},
          {code:'M',label:'Shaping not acc. to specification (moulding defects, blowholes)',points:50},
          {code:'O',label:'Position (dimension) not acc. to specification',points:100},
        ]
      },
      {
        code: '4.4', label: 'Foamed grommets (PUR-Elastomer) / Overmoulds',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged with tightness affected',points:100},
          {code:'D',label:'Damaged / without leaking',points:50},
          {code:'E',label:'Assembly not acc. to specification (orientation)',points:100},
          {code:'K',label:'Wire insulation damaged',points:100},
          {code:'L',label:'Wire visible on grommet surface',points:75},
          {code:'M',label:'Shaping not acc. to specification (moulding defects, blowholes)',points:50},
          {code:'N',label:'Feathering / bulging, protruding material',points:50},
          {code:'O',label:'Position (dimension) not acc. to specification',points:100},
        ]
      },
      {
        code: '4.5', label: 'Lengthwise wire sealing (e.g. Butyl)',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged with tightness affected',points:100},
          {code:'D',label:'Damaged / without leaking',points:50},
          {code:'E',label:'Assembly not acc. to specification (orientation)',points:100},
          {code:'K',label:'Wire insulation damaged',points:100},
          {code:'N',label:'Feathering / bulging, protruding material',points:50},
          {code:'O',label:'Position (dimension) not acc. to specification',points:100},
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 5 — WIRE PROTECTIVE SYSTEMS
  // ═══════════════════════════════════════════════════════════
  {
    id: '5', label: 'Wire Protective Systems',
    components: [
      {
        code: '5.1', label: 'Insulation of welded-/pressed connections and cable lugs / ring terminals (heat-shrink sleeve/PVC/taping/insulation caps)',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged',points:75},
          {code:'D',label:'Dimension / diameter not acc. to specification',points:75},
          {code:'F',label:'Insulation pierced (single strand)',points:100},
          {code:'H',label:'Conductor insulation not overlapped acc. to specification',points:75},
          {code:'K',label:'Heat-shrink sleeve leaking (bubble test)',points:100},
          {code:'M',label:'Insulation damaged, torn / burnt',points:100},
          {code:'N',label:'Heat-shrink adhesive on functional area',points:75},
          {code:'P',label:'Heat-Shrink sleeve: Identification missing',points:50},
          {code:'Q',label:'Heat-Shrink sleeve with glue not transparent **',points:50},
        ]
      },
      {
        code: '5.2', label: 'Insulation sleeve / foam tubes, braided sleeve, abrasion sheets, corrugated tubes',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Damaged',points:50},
          {code:'D',label:'Dimension / diameter not acc. to specification',points:50},
          {code:'E',label:'Glued joint / shifting insulation sleeve n.o.k.',points:50},
          {code:'G',label:'Lengthwise fold along the sleeve in grommet area',points:100},
          {code:'R',label:'Assembly n.o.k.',points:50},
          {code:'S',label:'Corrugated Sleeve incorrectly cut',points:50},
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 6 — TAPING
  // ═══════════════════════════════════════════════════════════
  {
    id: '6', label: 'Taping',
    components: [
      {
        code: '6.1', label: 'Taping',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Tape (material) not acc. to specification',points:100},
          {code:'D',label:'Damaged',points:50},
          {code:'E',label:'Closed / full taping not realised acc. to specification',points:100},
          {code:'F',label:'Taped not acc. to specification (Spiral- or spot tape, not taped / fixed)',points:50},
          {code:'G',label:'Dimension not acc. to specification',points:50},
          {code:'H',label:'Flagging (tape end loose)',points:25},
          {code:'I',label:'Tapping not started from the housing / cable lug / ring terminal',points:50},
          {code:'J',label:'Soft wrapping missing, air cushion not pierced',points:50},
        ]
      },
      {
        code: '6.2', label: 'Assembly marks',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Tape (material) not acc. to specification',points:50},
          {code:'D',label:'Damaged',points:50},
          {code:'F',label:'Taped not acc. to specification (Spiral- or spot tape, not taped / fixed)',points:50},
          {code:'G',label:'Dimension not acc. to specification',points:100},
          {code:'H',label:'Flagging (tape end loose)',points:25},
        ]
      },
      {
        code: '6.3', label: 'Auxiliary tape',
        defauts: [
          {code:'A',label:'Missing',points:25},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Tape (material) not acc. to specification',points:25},
          {code:'D',label:'Damaged',points:25},
          {code:'F',label:'Taped not acc. to specification (Spiral- or spot tape, not taped / fixed)',points:25},
          {code:'G',label:'Dimension not acc. to specification',points:25},
          {code:'H',label:'Flagging (tape end loose)',points:25},
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 7 — GENERAL COMPONENTS (taping / assembly of components)
  // ═══════════════════════════════════════════════════════════
  {
    id: '7', label: 'General Components',
    components: [
      {
        code: '7.1', label: 'Assembly- / form- / add on parts (clips / cable ties etc.)',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Tape (material) not acc. to specification',points:50},
          {code:'D',label:'Damaged',points:50},
          {code:'F',label:'Taped not acc. to specification (Spiral- or spot tape, not taped / fixed)',points:50},
          {code:'G',label:'Dimension not acc. to specification',points:100},
          {code:'H',label:'Flagging (tape end loose)',points:50},
          {code:'L',label:'Assembly / latching n.o.k.',points:75},
          {code:'M',label:'Positioning / orientation not o.k. (X/Y-Axis)',points:75},
          {code:'N',label:'Cable tie not cut off flush, sharp edged',points:50},
          {code:'O',label:'Fastening element / cable tie on weld joint',points:75},
          {code:'P',label:'Tape or cable tie on functional area / latching point',points:75},
        ]
      },
      {
        code: '7.2', label: 'Protective caps, end- & connecting pieces',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'C',label:'Tape (material) not acc. to specification',points:50},
          {code:'D',label:'Damaged',points:75},
          {code:'F',label:'Taped not acc. to specification (Spiral- or spot tape, not taped / fixed)',points:50},
          {code:'L',label:'Assembly / latching n.o.k.',points:50},
          {code:'M',label:'Positioning / orientation not o.k. (X/Y-Axis)',points:75},
          {code:'P',label:'Tape or cable tie on functional area / latching point',points:75},
        ]
      },
      {
        code: '7.3', label: 'Screw joints',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'D',label:'Damaged',points:100},
          {code:'L',label:'Assembly / latching n.o.k.',points:100},
          {code:'P',label:'Tape or cable tie on functional area / latching point',points:75},
        ]
      },
      {
        code: '7.4', label: 'Fuses, relays',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'D',label:'Damaged',points:100},
          {code:'K',label:'Fuse, relays wrong',points:100},
          {code:'L',label:'Assembly / latching n.o.k.',points:75},
          {code:'P',label:'Tape or cable tie on functional area / latching point',points:75},
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 8 — PRODUCT-PACKAGING / IDENTIFICATION
  // ═══════════════════════════════════════════════════════════
  {
    id: '8', label: 'Product-Packaging / Identification',
    components: [
      {
        code: '8.1', label: 'Label / barcode',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'D',label:'Damaged',points:75},
          {code:'G',label:'Dimension not acc. to specification',points:75},
          {code:'H',label:'Flagging (tape end loose)',points:50},
          {code:'L',label:'Assembly / latching N.O.K.',points:75},
          {code:'R',label:'Text / barcode illegible',points:75},
        ]
      },
      {
        code: '8.2', label: 'Packaging',
        defauts: [
          {code:'A',label:'Missing',points:100},
          {code:'B',label:'Incorrect, general',points:75},
          {code:'D',label:'Damaged',points:75},
          {code:'R',label:'Text / barcode illegible',points:50},
          {code:'S',label:'Packaging not acc. to specification',points:100},
          {code:'T',label:'Protective element missing',points:75},
        ]
      },
    ]
  },
];

// ── Helpers ─────────────────────────────────────────────────────
export function getComponent(componentCode) {
  for (const cat of LEONI_DEFECT_CATEGORIES) {
    const comp = cat.components.find(c => c.code === componentCode);
    if (comp) return comp;
  }
  return null;
}

export function getDefaut(componentCode, defautCode) {
  const comp = getComponent(componentCode);
  return comp ? comp.defauts.find(d => d.code === defautCode) : null;
}

// Recherche libre (composant OU libellé OU code lettre) pour la barre de recherche du catalogue
export function searchDefauts(query) {
  const q = (query || '').toLowerCase();
  const out = [];
  for (const cat of LEONI_DEFECT_CATEGORIES) {
    for (const comp of cat.components) {
      for (const d of comp.defauts) {
        if (!q
          || d.code.toLowerCase().includes(q)
          || d.label.toLowerCase().includes(q)
          || comp.label.toLowerCase().includes(q)
          || comp.code.includes(q)) {
          out.push({ category: cat.label, componentCode: comp.code, componentLabel: comp.label, ...d });
        }
      }
    }
  }
  return out;
}