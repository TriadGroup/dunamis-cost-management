export interface TourStep {
  target: string; // CSS Selector or "body"
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'none'; // Action required to move to next step automatically
}

export interface TourDefinition {
  id: string;
  name: string;
  steps: TourStep[];
}

export const tourDefinitions: Record<string, TourDefinition> = {
  global: {
    id: 'global',
    name: 'Visão Geral',
    steps: [
      {
        target: 'body',
        title: 'Bem-vindo à Dunamis Farm Agro!',
        content: 'Este é o sistema operacional da sua fazenda. Vamos te mostrar como ele organiza sua produção e seus custos de um jeito simples.',
        placement: 'center'
      },
      {
        target: '.app-rail',
        title: 'Navegação Principal',
        content: 'Aqui você alterna entre o Início, a Base do sistema, a Operação do dia a dia e o Acompanhamento dos resultados.',
        placement: 'right'
      },
      {
        target: '.sidebar-panel-group',
        title: 'Atalhos Contextuais',
        content: 'Cada módulo tem suas próprias ferramentas aqui. É onde você gerencia culturas, insumos e planos.',
        placement: 'right'
      },
      {
        target: '[data-tour="stage-card"]',
        title: 'Estágio da Fazenda',
        content: 'O sistema te guia pelo que falta fazer. Conforme você registra a rotina, essa área muda para te mostrar o próximo passo.',
        placement: 'bottom'
      },
      {
        target: '.mode-switch',
        title: 'Modos de Visão',
        content: 'Temos o modo Executivo (para ver números e lucros) e o Operacional (para quem está com a mão na massa no campo).',
        placement: 'left'
      },
      {
        target: '.sidebar-summary-card',
        title: 'Status e Sync',
        content: 'Veja aqui se sua base está pronta e se seus dados estão salvos com segurança.',
        placement: 'right'
      },
      {
        target: 'body',
        title: 'Tudo pronto!',
        content: 'Agora explore os módulos. Se tiver dúvida em qualquer tela, clique no botão "Como usar" no topo da página.',
        placement: 'center'
      }
    ]
  },
  dashboard: {
    id: 'dashboard',
    name: 'Como usar o Início',
    steps: [
      {
        target: '.home-next-step-panel',
        title: 'Central de Ações',
        content: 'O sistema analisa seus dados e sugere a tarefa mais urgente. Se houver algo crítico, como um custo não apropriado ou uma colheita pendente, aparecerá aqui.',
        placement: 'bottom'
      },
      {
        target: '.home-checklist-grid',
        title: 'Checklist de Base',
        content: 'Para que sua "Conta Real" seja perfeita, precisamos de 3 coisas: Culturas cadastradas, Planos de plantio ativos e Canais de venda definidos. Complete esses pontos para destravar todo o poder do sistema.',
        placement: 'top'
      },
      {
        target: '.executive-grid:first-of-type',
        title: 'A Saúde da Fazenda',
        content: 'Estes cards mostram o custo mensal atual e os investimentos em andamento. É o seu termômetro financeiro rápido.',
        placement: 'bottom'
      },
      {
        target: '.home-stage-side',
        title: 'Visão Geral do Ciclo',
        content: 'Aqui você acompanha o nascimento do seu lucro. Conforme as aplicações e colheitas acontecem, os números de custo real e venda sugerida são atualizados automaticamente.',
        placement: 'left'
      }
    ]
  },
  'production-planning': {
    id: 'production-planning',
    name: 'Planejando o Plantio',
    steps: [
      {
        target: '[data-tour="new-culture-btn"]',
        title: '1. A Planta',
        content: 'Comece definindo o que você planta. Aqui você informa o custo da semente/muda e o espaçamento. Isso é a base para o sistema calcular quantas plantas cabem na sua terra.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="new-plan-btn"]',
        title: '2. A Terra',
        content: 'Depois de ter a cultura, crie um Plano. Você escolhe a área (ex: Quadra A, Estufa 1) e o sistema te diz exatamente quanto você vai gastar para encher aquela área.',
        placement: 'bottom'
      },
      {
        target: '.executive-grid',
        title: 'Métricas de Unidade',
        content: 'Importante: O sistema trabalha para te dar o custo por UNIDADE (pé, maço, cabeça). Isso ajuda você a saber se está ganhando ou perdendo dinheiro em cada planta individualmente.',
        placement: 'bottom'
      }
    ]
  },
  inventory: {
    id: 'inventory',
    name: 'Gerenciando Insumos',
    steps: [
      {
        target: '.detail-card:first-of-type',
        title: 'Seu Armazém Virtual',
        content: 'Aqui você controla o que comprou e ainda não aplicou no campo. É o coração da sua logística.',
        placement: 'bottom'
      },
      {
        target: '.executive-grid',
        title: 'Valor Estocado',
        content: 'Este número representa dinheiro parado em prateleira. O objetivo é manter esse estoque girando para alimentar a produção.',
        placement: 'bottom'
      },
      {
        target: '.table-lite',
        title: 'Lotes e Rastreabilidade',
        content: 'Cada entrada vira um lote específico. Isso permite saber, por exemplo, qual fertilizante foi usado em qual alface e quanto ele custou na época.',
        placement: 'top'
      }
    ]
  },
  'plan-wizard': {
    id: 'plan-wizard',
    name: 'Mágica do Planejamento',
    steps: [
      {
        target: '[data-tour="plan-area-input"]',
        title: 'Tamanho do Plantio',
        content: 'Informe a área em m². O sistema já conhece o espaçamento da cultura e vai te dizer quantas plantas cabem aqui.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="plan-bed-input"]',
        title: 'Divisão em Canteiros',
        content: 'Diga em quantos canteiros você vai dividir essa produção. Isso ajuda na organização visual do campo.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="plan-calculation-results"]',
        title: 'A Conta Automática',
        content: 'Pronto! O sistema te diz o Total de Mudas, a Perda Esperada e o Investimento Inicial necessário.',
        placement: 'top'
      },
      {
        target: '[data-tour="plan-save-btn"]',
        title: 'Concluir Plano',
        content: 'Ao salvar, este plano vira uma meta operacional. O sistema passará a cobrar os registros de aplicação e colheita para ele.',
        placement: 'top'
      }
    ]
  },
  implantation: {
    id: 'implantation',
    name: 'Projetos de Investimento',
    steps: [
      {
        target: '[data-tour="implantation-summary"]',
        title: 'Onde o dinheiro está indo',
        content: 'Diferente do custeio mensal, aqui você vê os investimentos de longo prazo (ex: montar uma estufa nova).',
        placement: 'bottom'
      },
      {
        target: '.executive-grid:first-of-type',
        title: 'Orçado vs Comprometido',
        content: 'Veja quanto você planejou gastar e quanto de fato já foi gasto em notas fiscais e compras registradas.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="new-project-btn"]',
        title: 'Criar Novo Projeto',
        content: 'Use isto para grandes obras ou compras de equipamentos. Cada projeto pode ter vários itens dentro.',
        placement: 'bottom'
      }
    ]
  },
  purchases: {
    id: 'purchases',
    name: 'Registro de Entradas',
    steps: [
      {
        target: '[data-tour="new-purchase-btn"]',
        title: 'Comprei algo, e agora?',
        content: 'Sempre que chegar uma nota ou você comprar algo, registre aqui. É isso que alimenta o seu estoque e diz ao sistema quanto a fazenda está gastando.',
        placement: 'bottom'
      },
      {
        target: '.search-bar-wrap',
        title: 'Busca Rápida',
        content: 'Encontre compras passadas pelo nome do fornecedor ou produto. Ajuda a comparar preços entre datas.',
        placement: 'bottom'
      },
      {
        target: '.table-lite',
        title: 'Status Financeiro',
        content: 'Acompanhe o que já foi pago e o que ainda está pendente. O custo real só considera o que entrou na fazenda.',
        placement: 'top'
      }
    ]
  },
  costs: {
    id: 'costs',
    name: 'Custos Recorrentes',
    steps: [
      {
        target: '.executive-grid',
        title: 'Contas do Dia a Dia',
        content: 'Aqui entram as despesas que "mantêm a porteira aberta", como energia, combustível, manutenção e salários. Elas acontecem independente de quanto você planta.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="new-cost-btn"]',
        title: 'Novo Lançamento',
        content: 'Sempre que pagar uma conta, registre aqui. Isso ajuda o sistema a calcular o seu "Custo Fixo" e diluí-lo por cada pé de alface produzido.',
        placement: 'bottom'
      },
      {
        target: '.table-lite',
        title: 'Acompanhamento Mensal',
        content: 'Veja se seus custos estão dentro do esperado. Manter o custo fixo sob controle é o que garante que sobre mais dinheiro no final do mês.',
        placement: 'top'
      }
    ]
  },
  'field-operations': {
    id: 'field-operations',
    name: 'Operações de Campo',
    steps: [
      {
        target: '[data-tour="new-operation-btn"]',
        title: 'Mão na Massa',
        content: 'Aqui você registra o que aplicou no campo (adubo, defensivo). É esse registro que "consome" o produto do estoque e coloca o valor dele direto na conta daquela cultura.',
        placement: 'bottom'
      },
      {
        target: '.executive-grid',
        title: 'Eficiência de Aplicação',
        content: 'Monitore quanto de insumo você está usando. O equilíbrio aqui é fundamental: usar o suficiente para a planta crescer bem, sem desperdiçar dinheiro.',
        placement: 'bottom'
      },
      {
        target: '.table-lite',
        title: 'Histórico de Tratos',
        content: 'Quem aplicou, quando e quanto? Tenha o controle total para garantir a qualidade do seu produto e a segurança do seu estoque.',
        placement: 'top'
      }
    ]
  },
  harvest: {
    id: 'harvest',
    name: 'Hora da Colheita',
    steps: [
      {
        target: '[data-tour="new-harvest-btn"]',
        title: 'Registrar Saída',
        content: 'O momento da verdade! Informe quanto colheu de cada lote. Isso encerra a fase de gastos e inicia a fase de entrada de dinheiro.',
        placement: 'bottom'
      },
      {
        target: '.executive-grid',
        title: 'Produtividade de Campo',
        content: 'Veja o total de "Plantas Boas" que saíram. O sistema compara isso com o que foi plantado para te mostrar se você atingiu sua meta de produção.',
        placement: 'bottom'
      },
      {
        target: '.table-lite',
        title: 'Destino da Produção',
        content: 'Sabe exatamente para onde cada caixa foi? Ceasa, Doação, Venda Direta ou Perda? O controle de destino é vital para sua rastreabilidade.',
        placement: 'top'
      }
    ]
  },
  'demand-channels': {
    id: 'demand-channels',
    name: 'Canais de Venda',
    steps: [
      {
        target: '[data-tour="new-channel-btn"]',
        title: 'Onde Vender?',
        content: 'Cadastre seus compradores: Restaurantes, Quitandas, Supermercados. Cada um tem um preço e uma exigência diferente.',
        placement: 'bottom'
      },
      {
        target: '.executive-grid',
        title: 'Ranking de Canais',
        content: 'O sistema mostra quais canais são mais lucrativos. Às vezes vender menos para o canal certo dá mais lucro que vender muito para o canal errado.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="apply-scenario-btn"]',
        title: 'Cenários de Demanda',
        content: 'Planeje-se! O que acontece se a demanda subir 20%? Use os cenários para ver se sua produção atual aguenta o tranco ou se precisa plantar mais.',
        placement: 'bottom'
      }
    ]
  },
  'real-costs': {
    id: 'real-costs',
    name: 'O Lucro Real',
    steps: [
      {
        target: '.executive-grid',
        title: 'A Verdade dos Números',
        content: 'Aqui você vê se a conta fechou. O sistema soma tudo o que você gastou e compara com o que você vendeu.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="real-costs-filter"]',
        title: 'Visões Diferentes',
        content: 'Analise seu custo por Cultura, por Plano ou por Lote. Assim você descobre exatamente onde está ganhando ou perdendo dinheiro.',
        placement: 'bottom'
      },
      {
        target: '.table-lite',
        title: 'Métrica de Unidade',
        content: 'Compare seu custo real por unidade com o seu preço médio de venda. Essa diferença é o seu lucro no bolso.',
        placement: 'top'
      }
    ]
  },
  'unit-economics': {
    id: 'unit-economics',
    name: 'Decidindo o Preço',
    steps: [
      {
        target: '.executive-grid',
        title: 'Médias Inteligentes',
        content: 'Veja sua média de custo e quanto o mercado está pagando. Isso te dá segurança para negociar com seus compradores.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="unit-economics-table"]',
        title: 'Tabela de Decisão',
        content: 'O sistema sugere o "Preço de Venda Mínimo" para você não ter prejuízo, e o "Preço Sugerido" para atingir seu lucro pretendido.',
        placement: 'top'
      }
    ]
  },
  traceability: {
    id: 'traceability',
    name: 'Histórico Completo',
    steps: [
      {
        target: '[data-tour="new-lot-btn"]',
        title: 'Abrir Novo Lote',
        content: 'Sempre que plantar um novo lote, registre aqui. É como abrir o "RG" daquela planta, que vai carregar todo o histórico até a mesa do cliente.',
        placement: 'bottom'
      },
      {
        target: '.executive-grid',
        title: 'Qualidade dos Dados',
        content: 'Acompanhe a completude da sua rastreabilidade. Quanto mais registros você fizer, mais confiança você terá nos seus custos e na sua qualidade.',
        placement: 'bottom'
      },
      {
        target: '.table-lite',
        title: 'Timeline da Produção',
        content: 'Veja toda a vida do lote em uma linha do tempo clara: do dia que a semente chegou até o dia da colheita.',
        placement: 'top'
      }
    ]
  },
  settings: {
    id: 'settings',
    name: 'Ajustes Finos',
    steps: [
      {
        target: '[data-tour="acceptance-checklist-table"]',
        title: 'Sua Lista de Tarefas',
        content: 'Acompanhe o que falta para sua fazenda estar 100% configurada no sistema. O objetivo é ver tudo "Verde" aqui.',
        placement: 'top'
      },
      {
        target: '[data-tour="settings-reset-card"]',
        title: 'Ferramentas de Reinício',
        content: 'Errou o setup ou quer começar uma nova safra do zero? Use o reset para limpar os dados e recomeçar com a base limpa.',
        placement: 'top'
      }
    ]
  },
  'purchase-wizard': {
    id: 'purchase-wizard',
    name: 'Guia de Registro de Compra',
    steps: [
      {
        target: '[data-tour="purchase-name"]',
        title: 'O que você comprou?',
        content: 'Dê um nome claro para o produto. Se for algo que você já comprou antes, o sistema vai sugerir o nome para você economizar tempo.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="purchase-supplier"]',
        title: 'Quem vendeu?',
        content: 'Registrar o fornecedor é vital para comparar quem tem o melhor preço ao longo do ano.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="purchase-value"]',
        title: 'Quanto custou?',
        content: 'Informe o valor total da nota ou do recibo. O sistema vai usar isso para calcular o custo unitário do insumo automaticamente.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="purchase-stockable"]',
        title: 'Controle de Estoque',
        content: 'Se marcar como "Sim", o produto vai para o seu armazém virtual e você só paga o custo dele quando de fato usar no campo. Se marcar "Não", o valor cai direto na conta da cultura hoje.',
        placement: 'top'
      },
      {
        target: '[data-tour="purchase-destination"]',
        title: 'Para onde vai?',
        content: 'Vincule a compra a uma área ou cultura específica. Isso é o que permite ao sistema dizer: "Este alface custou X reais em adubo".',
        placement: 'top'
      }
    ]
  },
  'cost-wizard': {
    id: 'cost-wizard',
    name: 'Guia de Lançamento de Custos',
    steps: [
      {
        target: '[data-tour="cost-name"]',
        title: 'Nome da Despesa',
        content: 'Identifique a conta. Ex: "Energia Elétrica Jan/26" ou "Manutenção Trator".',
        placement: 'bottom'
      },
      {
        target: '[data-tour="cost-value"]',
        title: 'Valor do Pagamento',
        content: 'Quanto saiu do bolso agora? Este valor entrará no seu fluxo de caixa do mês.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="cost-monthly-weight"]',
        title: 'Peso Mensal',
        content: 'Alguns custos são pagos de uma vez mas valem pelo ano todo (ex: IPVA, Seguro). Aqui você diz quanto dessa conta deve ser considerada por mês para não distorcer o lucro de uma única colheita.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="cost-center"]',
        title: 'Centro de Custo',
        content: 'Separe o que é gasto do "Campo Aberto", "Escritório" ou "Oficina". Ajuda a ver onde a fazenda está sendo ineficiente.',
        placement: 'top'
      }
    ]
  },
  'operation-wizard': {
    id: 'operation-wizard',
    name: 'Guia de Aplicação de Campo',
    steps: [
      {
        target: '[data-tour="operation-stock-lot"]',
        title: 'Saída do Armazém',
        content: 'Escolha de qual lote veio o produto. O sistema já sabe quanto custou cada grama desse lote e vai transferir o valor para a planta.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="operation-quantity"]',
        title: 'Quanto foi aplicado?',
        content: 'Informe a quantidade exata (L, Kg, Unid). O sistema vai abater isso do seu estoque automaticamente.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="operation-lot"]',
        title: 'Onde foi aplicado?',
        content: 'Selecione o lote de produção que recebeu o trato. É aqui que o custo do insumo "gruda" na planta.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="operation-responsible"]',
        title: 'Quem fez o serviço?',
        content: 'Importante para segurança e rastreabilidade. Saber quem aplicou ajuda a auditar a qualidade do processo depois.',
        placement: 'top'
      }
    ]
  },
  'harvest-wizard': {
    id: 'harvest-wizard',
    name: 'Guia de Registro de Colheita',
    steps: [
      {
        target: '[data-tour="harvest-lot"]',
        title: 'Qual lote está saindo?',
        content: 'Escolha o lote que está sendo colhido. O sistema vai encerrar a conta de custos dele aqui.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="harvest-gross"]',
        title: 'Produção Bruta',
        content: 'Quanto saiu do chão? Inclua tudo, mesmo o que não vai poder ser vendido.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="harvest-loss"]',
        title: 'Quebra/Perda de Colheita',
        content: 'Informe quanto se perdeu no processo. Entender sua taxa de perda é fundamental para aumentar seu lucro no próximo ciclo.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="harvest-destinations"]',
        title: 'Para onde foi a carga?',
        content: 'Divida a colheita entre seus compradores (Ceasa, Venda Direta, etc). O sistema vai calcular o faturamento esperado baseado nisso.',
        placement: 'top'
      }
    ]
  },
  'lot-wizard': {
    id: 'lot-wizard',
    name: 'Guia de Criação de Lote',
    steps: [
      {
        target: '[data-tour="lot-crop"]',
        title: 'Escolha a Cultura',
        content: 'O lote é a identidade de um plantio específico. Comece escolhendo o que será plantado.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="lot-origin"]',
        title: 'Origem da Muda',
        content: 'De onde veio a semente? Se houve problema de germinação, você vai saber exatamente qual fornecedor cobrar.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="lot-quantity-received"]',
        title: 'Entrada na Fazenda',
        content: 'Quantas mudas/sementes chegaram de verdade? Isso define seu potencial máximo de colheita.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="lot-location"]',
        title: 'Onde será o berço?',
        content: 'Identifique o local físico (Quadra, Estufa, Canteiro). É aqui que o histórico de clima e tratos será vinculado.',
        placement: 'top'
      }
    ]
  },
  'culture-wizard': {
    id: 'culture-wizard',
    name: 'Guia de Cadastro de Cultura',
    steps: [
      {
        target: '[data-tour="cult-name"]',
        title: 'Nome da Cultura',
        content: 'Ex: Alface Americana, Tomate Cereja. Seja específico para separar bem os custos depois.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="cult-spacing"]',
        title: 'Configuração de Plantio',
        content: 'Informe o espaçamento entre linhas e entre plantas. O sistema usa isso para calcular sua capacidade produtiva por m².',
        placement: 'bottom'
      },
      {
        target: '[data-tour="cult-cycle"]',
        title: 'Ciclo de Produção',
        content: 'Quantos dias da semente até a colheita? Isso ajuda o sistema a prever quando você terá dinheiro entrando no caixa.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="cult-unit"]',
        title: 'Unidade de Venda',
        content: 'Como você vende? Por quilo, por maço, por caixa? Escolher a unidade certa garante que o preço sugerido faça sentido no seu mercado.',
        placement: 'top'
      }
    ]
  },
  'implantation-wizard': {
    id: 'implantation-wizard',
    name: 'Guia de Projeto de Implantação',
    steps: [
      {
        target: '[data-tour="impl-project-select"]',
        title: 'Vincular a um Projeto',
        content: 'Agrupe gastos relacionados. Ex: "Nova Estufa Sul". Isso permite ver o custo total de uma obra grande.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="impl-item-name"]',
        title: 'O que está sendo implantado?',
        content: 'Dê um nome ao item. Ex: "Sistema de Irrigação", "Cobertura Plástica".',
        placement: 'bottom'
      },
      {
        target: '[data-tour="impl-deadline"]',
        title: 'Prazo Alvo',
        content: 'Quando essa etapa precisa estar pronta? O sistema vai te alertar se o investimento estiver atrasado.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="impl-payment-mode"]',
        title: 'Como será pago?',
        content: 'À vista, parcelado, financiado? Isso ajuda a projetar as saídas de caixa da fazenda nos próximos meses.',
        placement: 'top'
      }
    ]
  }
};
