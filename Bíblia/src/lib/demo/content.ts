import type {
  AuthorRecord,
  ChapterSeed,
  CollectionRecord,
  CommentaryRecord,
  CrossReferenceRecord,
  EditorialNoteRecord,
  LanguageNoteRecord,
  SourceItemRecord,
  SourceRegisterEntry,
  ThemeRecord,
  TraditionRecord,
  TranslationRecord,
  WorkRecord
} from "@/lib/demo/types";

export const translations: TranslationRecord[] = [
  {
    code: "naa",
    name: "Nova Almeida Atualizada",
    publisher: "Sociedade Bíblica do Brasil",
    rightsHolder: "Sociedade Bíblica do Brasil",
    licenseStatus: "restricted",
    activationStatus: "pending_license",
    providerKind: "licensed_provider",
    canBundle: false,
    summary: "Arquitetura pronta para ativação via licenciamento ou provider aprovado.",
    attribution: "Status exibido com base em documentação pública da SBB.",
    docsUrl: "https://www.sbb.org.br/nova-almeida/o/a-nova-almeida-atualizada/"
  },
  {
    code: "nvi",
    name: "Nova Versão Internacional",
    publisher: "Biblica",
    rightsHolder: "Biblica, Inc.",
    licenseStatus: "restricted",
    activationStatus: "pending_license",
    providerKind: "licensed_provider",
    canBundle: false,
    summary: "Sem texto embarcado até confirmação contratual com o detentor de direitos.",
    attribution: "Permissões e limites devem seguir a política pública da Biblica.",
    docsUrl: "https://www.biblica.com/permissions/"
  },
  {
    code: "bkj",
    name: "BKJ / Bíblia King James Atualizada",
    publisher: "Abba Press",
    rightsHolder: "Abba Press / detentor editorial informado pelo fornecedor",
    licenseStatus: "restricted",
    activationStatus: "pending_license",
    providerKind: "licensed_provider",
    canBundle: false,
    summary: "Integração reservada para fonte licenciada ou import autorizado.",
    attribution: "Não há bundle local enquanto a via de licenciamento não estiver formalizada.",
    docsUrl: "https://www.abbapress.com.br/produto/biblia-king-james-atualizada-kja-digital-e-book/"
  }
];

export const sourceRegister: SourceRegisterEntry[] = [
  {
    id: "biblica-permissions",
    name: "Biblica Permissions",
    url: "https://www.biblica.com/permissions/",
    sourceType: "rights_policy",
    trustLevel: "primary_high",
    primarySecondary: "primary",
    rightsStatus: "restricted",
    canBundle: false,
    requiresAttribution: true,
    notes: "Usado para mapear limites de uso da NVI e a necessidade de acordos formais."
  },
  {
    id: "sbb-naa",
    name: "SBB — Nova Almeida Atualizada",
    url: "https://www.sbb.org.br/nova-almeida/o/a-nova-almeida-atualizada/",
    sourceType: "rights_policy",
    trustLevel: "primary_high",
    primarySecondary: "primary",
    rightsStatus: "restricted",
    canBundle: false,
    requiresAttribution: true,
    notes: "Página oficial da tradução; usada para metadata e trilha de licenciamento."
  },
  {
    id: "sbb-eula",
    name: "SBB — EULA",
    url: "https://www.sbb.org.br/acordo-de-licenca-de-usuario-final-eula/",
    sourceType: "license",
    trustLevel: "primary_high",
    primarySecondary: "primary",
    rightsStatus: "restricted",
    canBundle: false,
    requiresAttribution: true,
    notes: "Complementa as notas de uso digital e distribuição."
  },
  {
    id: "abba-press-kja",
    name: "Abba Press — KJA digital",
    url: "https://www.abbapress.com.br/produto/biblia-king-james-atualizada-kja-digital-e-book/",
    sourceType: "publisher_catalog",
    trustLevel: "primary_standard",
    primarySecondary: "primary",
    rightsStatus: "restricted",
    canBundle: false,
    requiresAttribution: true,
    notes: "Usado para registrar a disponibilidade editorial da KJA/BKJ."
  },
  {
    id: "api-bible",
    name: "API.Bible",
    url: "https://api.bible/",
    sourceType: "provider",
    trustLevel: "primary_high",
    primarySecondary: "primary",
    rightsStatus: "licensed",
    canBundle: false,
    requiresAttribution: true,
    notes: "Provider comercial/API para traduções licenciadas; entra como adapter suportado."
  },
  {
    id: "youversion-platform",
    name: "YouVersion Platform",
    url: "https://help.youversion.com/l/en/article/72ghg45c41-how-to-sign-up-for-platform",
    sourceType: "provider",
    trustLevel: "primary_high",
    primarySecondary: "primary",
    rightsStatus: "licensed",
    canBundle: false,
    requiresAttribution: true,
    notes: "Útil para avaliação de integração permitida, respeitando os termos específicos do programa."
  },
  {
    id: "ccel-copyright",
    name: "CCEL Copyright",
    url: "https://www.ccel.org/about/copyright.html",
    sourceType: "digital_library",
    trustLevel: "primary_high",
    primarySecondary: "primary",
    rightsStatus: "public_domain",
    canBundle: false,
    requiresAttribution: true,
    notes: "Biblioteca prioritária para comentários clássicos em domínio público; checagem item a item continua obrigatória."
  },
  {
    id: "sblgnt-license",
    name: "SBL Greek New Testament License",
    url: "https://sblgnt.com/license/",
    sourceType: "license",
    trustLevel: "primary_high",
    primarySecondary: "primary",
    rightsStatus: "licensed",
    canBundle: true,
    requiresAttribution: true,
    notes: "Fonte aberta para textos gregos e notas de língua original."
  },
  {
    id: "oshb",
    name: "Open Scriptures Hebrew Bible",
    url: "https://hb.openscriptures.org/",
    sourceType: "original_language_dataset",
    trustLevel: "primary_high",
    primarySecondary: "primary",
    rightsStatus: "licensed",
    canBundle: true,
    requiresAttribution: true,
    notes: "Base aberta para hebraico, morfologia e identificadores."
  },
  {
    id: "stepbible-data",
    name: "STEPBible Data",
    url: "https://stepbible.github.io/STEPBible-Data/",
    sourceType: "original_language_dataset",
    trustLevel: "primary_high",
    primarySecondary: "primary",
    rightsStatus: "licensed",
    canBundle: true,
    requiresAttribution: true,
    notes: "Útil para Strong's, transliteração e mapeamentos interlineares."
  },
  {
    id: "biblehub-jfb",
    name: "BibleHub Commentary Pages",
    url: "https://biblehub.com/commentaries/jfb/john/3.htm",
    sourceType: "public_domain_host",
    trustLevel: "secondary_high",
    primarySecondary: "secondary",
    rightsStatus: "public_domain",
    canBundle: false,
    requiresAttribution: true,
    notes: "Host prático para consulta de JFB; usar com verificação bibliográfica do texto histórico."
  }
];

export const sourceItems: SourceItemRecord[] = [
  {
    id: "calvin-john-vol1",
    sourceId: "ccel-copyright",
    title: "Commentary on John — Volume 1",
    language: "English",
    publicationYear: 1847,
    editionNotes: "CCEL edition of Calvin's commentary on John 1–11.",
    url: "https://ccel.org/ccel/calvin/calcom34/calcom34.toc.html",
    rightsStatus: "public_domain"
  },
  {
    id: "calvin-gal-eph",
    sourceId: "ccel-copyright",
    title: "Commentary on Galatians and Ephesians",
    language: "English",
    publicationYear: 1845,
    editionNotes: "CCEL edition with searchable sections for Ephesians.",
    url: "https://www.ccel.org/ccel/calvin/calcom41.html",
    rightsStatus: "public_domain"
  },
  {
    id: "henry-vol5",
    sourceId: "ccel-copyright",
    title: "Commentary on the Whole Bible Volume V (Matthew to John)",
    language: "English",
    publicationYear: 1708,
    editionNotes: "CCEL edition used for Gospel commentary coverage.",
    url: "https://ccel.org/ccel/henry/mhc5.John.i.html",
    rightsStatus: "public_domain"
  },
  {
    id: "henry-vol6",
    sourceId: "ccel-copyright",
    title: "Commentary on the Whole Bible Volume VI (Acts to Revelation)",
    language: "English",
    publicationYear: 1710,
    editionNotes: "CCEL edition used for Romans coverage.",
    url: "https://www.ccel.org/ccel/henry/mhc6.Rom.i.html",
    rightsStatus: "public_domain"
  },
  {
    id: "spurgeon-ps23-sermon",
    sourceId: "ccel-copyright",
    title: "The Lord Is My Shepherd",
    language: "English",
    publicationYear: 1906,
    editionNotes: "Spurgeon's Sermons, Volume 52, sermon no. 3006.",
    url: "https://ccel.org/ccel/spurgeon/sermons52/sermons52.xxxix.html",
    rightsStatus: "public_domain"
  },
  {
    id: "spurgeon-ps23-restorer",
    sourceId: "ccel-copyright",
    title: "My Restorer",
    language: "English",
    publicationYear: 1873,
    editionNotes: "Spurgeon's Sermons, Volume 19, sermon no. 1149.",
    url: "https://www.ccel.org/ccel/spurgeon/sermons19.lxi.html",
    rightsStatus: "public_domain"
  },
  {
    id: "jfb-john-3",
    sourceId: "biblehub-jfb",
    title: "Jamieson-Fausset-Brown on John 3",
    language: "English",
    publicationYear: 1871,
    editionNotes: "Hosted chapter view of JFB commentary for John 3.",
    url: "https://biblehub.com/commentaries/jfb/john/3.htm",
    rightsStatus: "public_domain"
  },
  {
    id: "sblgnt-license-item",
    sourceId: "sblgnt-license",
    title: "SBL Greek New Testament License",
    language: "English",
    publicationYear: 2010,
    editionNotes: "License page used for original-language provenance.",
    url: "https://sblgnt.com/license/",
    rightsStatus: "licensed"
  },
  {
    id: "oshb-item",
    sourceId: "oshb",
    title: "Open Scriptures Hebrew Bible",
    language: "English",
    publicationYear: 2024,
    editionNotes: "Official dataset page for Hebrew text infrastructure.",
    url: "https://hb.openscriptures.org/",
    rightsStatus: "licensed"
  },
  {
    id: "stepbible-item",
    sourceId: "stepbible-data",
    title: "STEPBible Data",
    language: "English",
    publicationYear: 2024,
    editionNotes: "Official data portal for lexicon/interlinear infrastructure.",
    url: "https://stepbible.github.io/STEPBible-Data/",
    rightsStatus: "licensed"
  }
];

export const traditions: TraditionRecord[] = [
  { slug: "patristica", name: "Patrística", family: "Histórico" },
  { slug: "reformada", name: "Reformada", family: "Protestante" },
  { slug: "anglicana", name: "Anglicana", family: "Protestante" },
  { slug: "batista", name: "Batista", family: "Evangélica" },
  { slug: "metodista", name: "Metodista", family: "Evangelical Wesleyan" }
];

export const authors: AuthorRecord[] = [
  {
    id: "augustine",
    slug: "agostinho-de-hipona",
    displayName: "Agostinho de Hipona",
    sortName: "Augustine of Hippo",
    birthYear: 354,
    deathYear: 430,
    eraLabel: "Antiguidade Tardia",
    centuryLabel: "Séculos IV–V",
    traditionSlug: "patristica",
    biography: "Bispo de Hipona e um dos teólogos mais influentes da tradição ocidental cristã.",
    sourceStatus: "public_domain",
    imageSeed: "A",
    aliases: ["augustine", "agostinho", "hipona"],
    featured: true
  },
  {
    id: "chrysostom",
    slug: "joao-crisostomo",
    displayName: "João Crisóstomo",
    sortName: "John Chrysostom",
    birthYear: 347,
    deathYear: 407,
    eraLabel: "Antiguidade Tardia",
    centuryLabel: "Século IV",
    traditionSlug: "patristica",
    biography: "Pregador patrístico conhecido pela leitura pastoral e retórica do texto bíblico.",
    sourceStatus: "public_domain",
    imageSeed: "JC",
    aliases: ["chrysostom", "crisostomo"],
    featured: true
  },
  {
    id: "calvin",
    slug: "joao-calvino",
    displayName: "João Calvino",
    sortName: "John Calvin",
    birthYear: 1509,
    deathYear: 1564,
    eraLabel: "Reforma",
    centuryLabel: "Século XVI",
    traditionSlug: "reformada",
    biography: "Reformador francês cuja obra exegética combina argumentação doutrinária e leitura atenta do texto.",
    sourceStatus: "public_domain",
    imageSeed: "JCa",
    aliases: ["calvin", "calvino", "joao calvino"],
    featured: true
  },
  {
    id: "matthew-henry",
    slug: "matthew-henry",
    displayName: "Matthew Henry",
    sortName: "Matthew Henry",
    birthYear: 1662,
    deathYear: 1714,
    eraLabel: "Pós-Reforma",
    centuryLabel: "Séculos XVII–XVIII",
    traditionSlug: "anglicana",
    biography: "Comentarista pastoral conhecido por exposições amplas e devocionais de toda a Bíblia.",
    sourceStatus: "public_domain",
    imageSeed: "MH",
    aliases: ["henry", "matthew henry"],
    featured: true
  },
  {
    id: "spurgeon",
    slug: "charles-spurgeon",
    displayName: "Charles H. Spurgeon",
    sortName: "Charles Haddon Spurgeon",
    birthYear: 1834,
    deathYear: 1892,
    eraLabel: "Século XIX",
    centuryLabel: "Século XIX",
    traditionSlug: "batista",
    biography: "Pregador batista londrino, notável por sermões bíblicos de alta densidade pastoral.",
    sourceStatus: "public_domain",
    imageSeed: "CS",
    aliases: ["spurgeon", "charles spurgeon", "c h spurgeon"],
    featured: true
  },
  {
    id: "jfb",
    slug: "jamieson-fausset-brown",
    displayName: "Jamieson-Fausset-Brown",
    sortName: "Jamieson-Fausset-Brown",
    eraLabel: "Século XIX",
    centuryLabel: "Século XIX",
    traditionSlug: "anglicana",
    biography: "Comentário coletivo do século XIX, frequentemente consultado por sua síntese filológica e histórica.",
    sourceStatus: "public_domain",
    imageSeed: "JFB",
    aliases: ["jfb", "jamieson fausset brown"],
    featured: true
  },
  {
    id: "wesley",
    slug: "john-wesley",
    displayName: "John Wesley",
    sortName: "John Wesley",
    birthYear: 1703,
    deathYear: 1791,
    eraLabel: "Século XVIII",
    centuryLabel: "Século XVIII",
    traditionSlug: "metodista",
    biography: "Teólogo e pregador metodista com forte preocupação pastoral e santificação.",
    sourceStatus: "public_domain",
    imageSeed: "JW",
    aliases: ["wesley", "john wesley"],
    featured: true
  }
];

export const works: WorkRecord[] = [
  {
    id: "calvin-john",
    slug: "commentary-on-john-volume-1",
    authorId: "calvin",
    title: "Commentary on John — Volume 1",
    workType: "commentary",
    publicationYear: 1847,
    originalLanguage: "French / Latin translated to English",
    sourceItemId: "calvin-john-vol1",
    rightsStatus: "public_domain",
    editionNotes: "CCEL edition of Calvin's commentary on John 1–11.",
    coverageSummary: "João 1–11, com subdivisão por perícopes."
  },
  {
    id: "calvin-gal-eph-work",
    slug: "commentary-on-galatians-and-ephesians",
    authorId: "calvin",
    title: "Commentary on Galatians and Ephesians",
    workType: "commentary",
    publicationYear: 1845,
    originalLanguage: "French / Latin translated to English",
    sourceItemId: "calvin-gal-eph",
    rightsStatus: "public_domain",
    editionNotes: "CCEL edition with section anchors for Eph 2.",
    coverageSummary: "Gálatas e Efésios, com notas versículo a versículo."
  },
  {
    id: "henry-vol5-work",
    slug: "matthew-henry-volume-v",
    authorId: "matthew-henry",
    title: "Commentary on the Whole Bible Volume V",
    workType: "commentary",
    publicationYear: 1708,
    originalLanguage: "English",
    sourceItemId: "henry-vol5",
    rightsStatus: "public_domain",
    editionNotes: "Volume covering Matthew to John.",
    coverageSummary: "Evangelhos, incluindo o Evangelho de João."
  },
  {
    id: "henry-vol6-work",
    slug: "matthew-henry-volume-vi",
    authorId: "matthew-henry",
    title: "Commentary on the Whole Bible Volume VI",
    workType: "commentary",
    publicationYear: 1710,
    originalLanguage: "English",
    sourceItemId: "henry-vol6",
    rightsStatus: "public_domain",
    editionNotes: "Volume covering Acts to Revelation.",
    coverageSummary: "Atos a Apocalipse, com cobertura de Romanos."
  },
  {
    id: "spurgeon-shepherd",
    slug: "the-lord-is-my-shepherd",
    authorId: "spurgeon",
    title: "The Lord Is My Shepherd",
    workType: "sermon",
    publicationYear: 1906,
    originalLanguage: "English",
    sourceItemId: "spurgeon-ps23-sermon",
    rightsStatus: "public_domain",
    editionNotes: "Sermon no. 3006.",
    coverageSummary: "Sermão expositivo sobre Salmo 23:1."
  },
  {
    id: "spurgeon-restorer",
    slug: "my-restorer",
    authorId: "spurgeon",
    title: "My Restorer",
    workType: "sermon",
    publicationYear: 1873,
    originalLanguage: "English",
    sourceItemId: "spurgeon-ps23-restorer",
    rightsStatus: "public_domain",
    editionNotes: "Sermon no. 1149.",
    coverageSummary: "Sermão sobre Salmo 23:3."
  },
  {
    id: "jfb-john-work",
    slug: "jamieson-fausset-brown-john-3",
    authorId: "jfb",
    title: "Jamieson-Fausset-Brown on John 3",
    workType: "commentary",
    publicationYear: 1871,
    originalLanguage: "English",
    sourceItemId: "jfb-john-3",
    rightsStatus: "public_domain",
    editionNotes: "Hosted chapter page used for coverage verification.",
    coverageSummary: "Comentário de capítulo para João 3."
  }
];

export const chapterSeeds: ChapterSeed[] = [
  {
    key: "joao-1",
    bookSlug: "joao",
    chapterNumber: 1,
    verseCount: 51,
    outline: ["Prólogo do Verbo", "Testemunho de João Batista", "Primeiros discípulos"],
    literaryContext: "O prólogo fornece a gramática teológica do evangelho inteiro.",
    historicalContext: "Texto moldado para apresentar Jesus ao mundo judaico e ao ambiente helenista."
  },
  {
    key: "joao-3",
    bookSlug: "joao",
    chapterNumber: 3,
    verseCount: 36,
    outline: ["Nicodemos e o novo nascimento", "O Filho enviado ao mundo", "João Batista testifica novamente"],
    literaryContext: "O capítulo move da incompreensão religiosa para a explicação da missão do Filho.",
    historicalContext: "Nicodemos representa o prestígio religioso judaico confrontado com a necessidade de regeneração."
  },
  {
    key: "romanos-8",
    bookSlug: "romanos",
    chapterNumber: 8,
    verseCount: 39,
    outline: ["Nenhuma condenação em Cristo", "Vida no Espírito", "Esperança escatológica", "Amor inseparável de Deus"],
    literaryContext: "Paulo costura justificação, santificação e esperança futura num único argumento.",
    historicalContext: "A carta responde a tensões de identidade e perseverança numa igreja mista de judeus e gentios."
  },
  {
    key: "efesios-2",
    bookSlug: "efesios",
    chapterNumber: 2,
    verseCount: 22,
    outline: ["Da morte para a vida", "Graça e fé", "Um novo povo em Cristo"],
    literaryContext: "Efésios 2 articula salvação, reconciliação e identidade eclesial.",
    historicalContext: "A seção é central para a compreensão paulina da graça e das obras."
  },
  {
    key: "tiago-2",
    bookSlug: "tiago",
    chapterNumber: 2,
    verseCount: 26,
    outline: ["Contra a parcialidade", "Fé e obras", "Abraão e Raabe como exemplos"],
    literaryContext: "Tiago usa exemplos concretos para denunciar fé verbal sem obediência visível.",
    historicalContext: "A seção dialoga com a prática comunitária e a ética do discipulado."
  },
  {
    key: "salmos-23",
    bookSlug: "salmos",
    chapterNumber: 23,
    verseCount: 6,
    outline: ["O Senhor como pastor", "Cuidado no vale", "Comunhão e casa do Senhor"],
    literaryContext: "Poema de confiança com forte movimento da metáfora do pastor para a mesa do anfitrião.",
    historicalContext: "A imagem pastoral conecta experiência de Davi e tradição de liderança divina sobre Israel."
  },
  {
    key: "isaias-53",
    bookSlug: "isaias",
    chapterNumber: 53,
    verseCount: 12,
    outline: ["O servo rejeitado", "O servo ferido", "O servo vindicado"],
    literaryContext: "Clímax dos cânticos do servo com tensão entre sofrimento e vindicação.",
    historicalContext: "Texto central para leituras messiânicas e para o debate intertestamentário."
  },
  {
    key: "genesis-1",
    bookSlug: "genesis",
    chapterNumber: 1,
    verseCount: 31,
    outline: ["Criação por palavra", "Ordem e separações", "Imagem de Deus", "Descanso antecipado"],
    literaryContext: "Gênesis 1 apresenta ordem, ritmo litúrgico e soberania criacional.",
    historicalContext: "Importante contraponto a cosmologias antigas do Antigo Oriente Próximo."
  }
];

export const themes: ThemeRecord[] = [
  {
    slug: "novo-nascimento",
    name: "Novo nascimento",
    description: "A regeneração como obra do Espírito e porta de entrada no reino de Deus.",
    doctrineFamily: "Soteriologia",
    featuredRefs: ["joao 3:3", "joao 3:5", "tito 3:5"]
  },
  {
    slug: "graca-e-fe",
    name: "Graça e fé",
    description: "Relação entre iniciativa divina, fé recebida e vida transformada.",
    doctrineFamily: "Soteriologia",
    featuredRefs: ["efesios 2:8", "romanos 3:28", "tiago 2:17"]
  },
  {
    slug: "pastoreio-divino",
    name: "Pastoreio divino",
    description: "Metáforas de condução, provisão e consolo na presença de Deus.",
    doctrineFamily: "Teologia Bíblica",
    featuredRefs: ["salmos 23:1", "joao 10:11", "1 pedro 5:4"]
  },
  {
    slug: "amor-de-deus",
    name: "Amor de Deus",
    description: "O amor de Deus como fundamento da missão do Filho e da esperança cristã.",
    doctrineFamily: "Teologia Sistemática",
    featuredRefs: ["joao 3:16", "romanos 5:8", "1 joao 4:9"]
  }
];

export const commentaryEntries: CommentaryRecord[] = [
  {
    id: "calvin-john-3-13-18",
    authorId: "calvin",
    workId: "calvin-john",
    sourceItemId: "calvin-john-vol1",
    contentKind: "editorial_summary",
    scopeType: "pericope",
    directness: "indirect",
    startRef: "joao 3:13",
    endRef: "joao 3:18",
    scopeLabel: "João 3:13–18",
    editorialSummary: "Calvino trata o envio do Filho como resposta divina à incapacidade humana de subir a Deus por mérito próprio; a fé aparece como recepção humilde da graça e não como conquista.",
    qualityScore: 0.95,
    confidenceScore: 0.93,
    reviewState: "published",
    locator: "John 3:13-18",
    provenanceNotes: "Resumo editorial em PT-BR baseado na seção correspondente do comentário de Calvino hospedado pela CCEL.",
    themeSlugs: ["novo-nascimento", "amor-de-deus", "graca-e-fe"],
    doctrineSlugs: ["soteriologia", "cristologia"]
  },
  {
    id: "calvin-eph-2-8-10",
    authorId: "calvin",
    workId: "calvin-gal-eph-work",
    sourceItemId: "calvin-gal-eph",
    contentKind: "editorial_summary",
    scopeType: "verse",
    directness: "direct",
    startRef: "efesios 2:8",
    endRef: "efesios 2:10",
    scopeLabel: "Efésios 2:8–10",
    editorialSummary: "Calvino insiste que a salvação é inteiramente graciosa, recebida pela fé, e que as boas obras entram como fruto do novo estado criado por Deus, não como causa meritória dele.",
    qualityScore: 0.97,
    confidenceScore: 0.96,
    reviewState: "published",
    locator: "Ephesians 2:8-10",
    provenanceNotes: "Resumo editorial com base na seção de Ef 2:8-10 no comentário de Calvino em CCEL.",
    themeSlugs: ["graca-e-fe"],
    doctrineSlugs: ["soteriologia"]
  },
  {
    id: "henry-john-3",
    authorId: "matthew-henry",
    workId: "henry-vol5-work",
    sourceItemId: "henry-vol5",
    contentKind: "editorial_summary",
    scopeType: "pericope",
    directness: "indirect",
    startRef: "joao 3:1",
    endRef: "joao 3:21",
    scopeLabel: "João 3:1–21",
    editorialSummary: "Matthew Henry lê o encontro com Nicodemos como exposição da insuficiência da religião meramente externa e como convite à fé pessoal no Filho enviado para salvar, não para condenar.",
    qualityScore: 0.92,
    confidenceScore: 0.9,
    reviewState: "published",
    locator: "John 3",
    provenanceNotes: "Resumo editorial em PT-BR derivado do volume V de Matthew Henry na CCEL.",
    themeSlugs: ["novo-nascimento", "amor-de-deus"],
    doctrineSlugs: ["soteriologia"]
  },
  {
    id: "henry-romans-8",
    authorId: "matthew-henry",
    workId: "henry-vol6-work",
    sourceItemId: "henry-vol6",
    contentKind: "editorial_summary",
    scopeType: "chapter",
    directness: "indirect",
    startRef: "romanos 8:1",
    endRef: "romanos 8:39",
    scopeLabel: "Romanos 8",
    editorialSummary: "Henry apresenta Romanos 8 como grande capítulo de consolo: o Espírito aplica a obra de Cristo, fortalece a mortificação do pecado e sustenta a esperança até a glória final.",
    qualityScore: 0.9,
    confidenceScore: 0.9,
    reviewState: "published",
    locator: "Romans 8",
    provenanceNotes: "Resumo editorial derivado do comentário de Matthew Henry sobre Romanos 8.",
    themeSlugs: ["graca-e-fe", "amor-de-deus"],
    doctrineSlugs: ["pneumatologia", "soteriologia"]
  },
  {
    id: "spurgeon-psalm-23-1",
    authorId: "spurgeon",
    workId: "spurgeon-shepherd",
    sourceItemId: "spurgeon-ps23-sermon",
    contentKind: "primary_quote",
    scopeType: "verse",
    directness: "direct",
    startRef: "salmos 23:1",
    endRef: "salmos 23:1",
    scopeLabel: "Salmo 23:1",
    excerptOriginal: "\"The Lord is my Shepherd\" is best of all.",
    excerptDisplay: "\"The Lord is my Shepherd\" is best of all.",
    editorialSummary: "Spurgeon destaca a força do pronome possessivo: a confiança do salmista não é apenas doutrinária, mas relacional e experiencial.",
    qualityScore: 0.96,
    confidenceScore: 0.97,
    reviewState: "published",
    locator: "Psalm 23:1",
    provenanceNotes: "Citação curta preservada do sermão público em domínio público hospedado pela CCEL; resumo editorial em PT-BR.",
    themeSlugs: ["pastoreio-divino"],
    doctrineSlugs: ["teologia-pastoral"]
  },
  {
    id: "spurgeon-psalm-23-3",
    authorId: "spurgeon",
    workId: "spurgeon-restorer",
    sourceItemId: "spurgeon-ps23-restorer",
    contentKind: "editorial_summary",
    scopeType: "verse",
    directness: "direct",
    startRef: "salmos 23:3",
    endRef: "salmos 23:3",
    scopeLabel: "Salmo 23:3",
    editorialSummary: "No sermão 'My Restorer', Spurgeon liga a restauração da alma ao cuidado persistente do Pastor que traz de volta o crente abatido e o fortalece para o caminho.",
    qualityScore: 0.94,
    confidenceScore: 0.94,
    reviewState: "published",
    locator: "Psalm 23:3",
    provenanceNotes: "Resumo editorial em PT-BR ancorado no sermão de Spurgeon publicado pela CCEL.",
    themeSlugs: ["pastoreio-divino"],
    doctrineSlugs: ["teologia-pastoral"]
  },
  {
    id: "jfb-john-3",
    authorId: "jfb",
    workId: "jfb-john-work",
    sourceItemId: "jfb-john-3",
    contentKind: "editorial_summary",
    scopeType: "chapter",
    directness: "indirect",
    startRef: "joao 3:1",
    endRef: "joao 3:36",
    scopeLabel: "João 3",
    editorialSummary: "A tradição JFB lê João 3 como progressão da busca hesitante de Nicodemos para a exposição da vida eterna e do testemunho final de João Batista sobre o Filho.",
    qualityScore: 0.84,
    confidenceScore: 0.83,
    reviewState: "published",
    locator: "John 3",
    provenanceNotes: "Resumo editorial baseado na página de capítulo hospedada pelo BibleHub para JFB; sinalizado como host secundário no registro de fontes.",
    themeSlugs: ["novo-nascimento", "amor-de-deus"],
    doctrineSlugs: ["cristologia"]
  },
  {
    id: "henry-john-book-intro",
    authorId: "matthew-henry",
    workId: "henry-vol5-work",
    sourceItemId: "henry-vol5",
    contentKind: "editorial_summary",
    scopeType: "book",
    directness: "indirect",
    startRef: "joao 1:1",
    endRef: "joao 21:25",
    scopeLabel: "Livro de João",
    editorialSummary: "Na introdução ao Evangelho de João, Henry acentua a apresentação de Cristo como revelação divina confiável e como chave para a plena suficiência do cânon.",
    qualityScore: 0.86,
    confidenceScore: 0.88,
    reviewState: "published",
    locator: "John introduction",
    provenanceNotes: "Resumo editorial derivado da introdução de Matthew Henry ao Evangelho de João na CCEL.",
    themeSlugs: ["amor-de-deus"],
    doctrineSlugs: ["revelacao"]
  }
];

export const editorialNotes: EditorialNoteRecord[] = [
  {
    id: "john-3-16-exegesis",
    noteType: "exegesis",
    startRef: "joao 3:16",
    endRef: "joao 3:16",
    title: "João 3:16 no fluxo do diálogo com Nicodemos",
    summary: "O versículo não aparece isolado: ele interpreta o novo nascimento, a elevação do Filho e a polaridade entre crer e permanecer sob condenação.",
    sourceItemIds: ["calvin-john-vol1", "henry-vol5", "jfb-john-3"]
  },
  {
    id: "ephesians-2-hermeneutics",
    noteType: "hermeneutics",
    startRef: "efesios 2:8",
    endRef: "efesios 2:10",
    title: "Como Efésios 2 se relaciona com Tiago 2",
    summary: "A plataforma lê o contraste clássico entre Paulo e Tiago no nível de função argumentativa: Paulo exclui mérito; Tiago exclui fé estéril.",
    sourceItemIds: ["calvin-gal-eph", "henry-vol6"]
  },
  {
    id: "psalm-23-history",
    noteType: "historical_note",
    startRef: "salmos 23:1",
    endRef: "salmos 23:6",
    title: "Metáforas do pastor no antigo Israel",
    summary: "A linguagem pastoral comunica governo, provisão, direção e defesa; no Salmo 23 a imagem evolui para hospitalidade e comunhão.",
    sourceItemIds: ["spurgeon-ps23-sermon"]
  }
];

export const languageNotes: LanguageNoteRecord[] = [
  {
    id: "john-3-anothen",
    startRef: "joao 3:3",
    endRef: "joao 3:3",
    language: "Grego",
    lemma: "ἄνωθεν",
    transliteration: "anothen",
    morphology: "advérbio",
    semanticDomain: "origem / repetição",
    note: "Pode significar 'de novo' e também 'do alto', o que explica a incompreensão de Nicodemos e a profundidade da resposta de Jesus.",
    sourceItemId: "sblgnt-license-item"
  },
  {
    id: "eph-2-chariti",
    startRef: "efesios 2:8",
    endRef: "efesios 2:8",
    language: "Grego",
    lemma: "χάριτί",
    transliteration: "chariti",
    morphology: "substantivo dativo singular",
    semanticDomain: "favor, graça",
    note: "O dativo enfatiza a esfera/instrumentalidade da graça como base da salvação em Paulo.",
    sourceItemId: "sblgnt-license-item"
  },
  {
    id: "psalm-23-roi",
    startRef: "salmos 23:1",
    endRef: "salmos 23:1",
    language: "Hebraico",
    lemma: "רֹעִי",
    transliteration: "ro'i",
    morphology: "substantivo com sufixo pronominal 1ª pessoa singular",
    semanticDomain: "pastorear, conduzir, alimentar",
    note: "A forma possessiva intensifica a confiança pessoal do salmista no cuidado de YHWH.",
    sourceItemId: "oshb-item"
  }
];

export const crossReferences: CrossReferenceRecord[] = [
  {
    id: "john-3-rom-5",
    fromRef: "joao 3:16",
    toRef: "romanos 5:8",
    relationType: "thematic",
    relevanceScore: 0.94,
    rationale: "Ambos articulam o amor de Deus demonstrado na missão salvífica de Cristo."
  },
  {
    id: "eph-2-james-2",
    fromRef: "efesios 2:8",
    toRef: "tiago 2:17",
    relationType: "thematic",
    relevanceScore: 0.92,
    rationale: "Útil para estudar a relação entre fé salvadora e boas obras."
  },
  {
    id: "psalm-23-john-10",
    fromRef: "salmos 23:1",
    toRef: "joao 10:11",
    relationType: "thematic",
    relevanceScore: 0.9,
    rationale: "A imagem do pastor se aprofunda cristologicamente no discurso do Bom Pastor."
  },
  {
    id: "isaiah-53-1peter-2",
    fromRef: "isaias 53:5",
    toRef: "1 pedro 2:24",
    relationType: "quotation",
    relevanceScore: 0.96,
    rationale: "Pedro ecoa a linguagem do servo ferido para interpretar a obra de Cristo."
  }
];

export const collections: CollectionRecord[] = [
  {
    slug: "vozes-sobre-joao-3",
    title: "Vozes históricas sobre João 3",
    description: "Leituras em camadas de João 3, combinando patrística, reforma e tradição devocional.",
    featuredRefs: ["joao 3:3", "joao 3:16"],
    authorIds: ["calvin", "matthew-henry", "spurgeon"]
  },
  {
    slug: "graca-fe-e-obras",
    title: "Graça, fé e obras",
    description: "Percurso temático para estudar Efésios 2, Romanos 8 e Tiago 2 em conjunto.",
    featuredRefs: ["efesios 2:8", "romanos 8:1", "tiago 2:17"],
    authorIds: ["calvin", "matthew-henry", "wesley"]
  }
];

export const featuredReferences = ["joao 3:16", "efesios 2:8", "salmos 23:1", "romanos 8:1", "isaias 53:5"];
