import { CasePrompt } from './types';

export const cases: CasePrompt[] = [
  {
    id: 'profit-airline',
    title: 'Airline Profitability Turnaround',
    category: 'profitability',
    difficulty: 'advanced',
    prompt: 'Our client is a mid-size regional airline operating in Europe. Despite a strong recovery in passenger demand post-pandemic, the airline has been unprofitable for the last three quarters. They fly 45 routes across 12 countries. The board is considering drastic measures including route cuts, fleet changes, and potential merger discussions. They want our recommendation on how to return to profitability within 18 months. What would your approach be?',
    clarifyingQuestions: [
      { question: 'What is the current load factor across routes?', answer: 'Average load factor is 68%, but it varies widely. About 15 routes are above 80%, 20 routes are between 60-80%, and 10 routes are below 60%.' },
      { question: 'What does the fleet look like?', answer: 'They operate a mixed fleet of 30 aircraft across 4 different types, which creates maintenance complexity. The average fleet age is 14 years.' },
      { question: 'What is the cost per available seat kilometer vs. competitors?', answer: 'Their CASK is about 15% higher than comparable regional carriers, primarily driven by fuel inefficiency from older aircraft and high maintenance costs.' },
      { question: 'Are there any labor agreements or contractual constraints?', answer: 'Yes, they have strong union agreements that make workforce reduction difficult. Pilot contracts are renegotiated next year.' },
    ],
    exampleFramework: {
      buckets: [
        { name: 'Route Profitability', subPoints: ['Revenue per route analysis', 'Load factor optimization', 'Route-level P&L', 'Cut vs. restructure underperformers'] },
        { name: 'Cost Restructuring', subPoints: ['Fleet simplification savings', 'Fuel efficiency improvements', 'Maintenance cost reduction', 'Overhead and SGA optimization'] },
        { name: 'Revenue Enhancement', subPoints: ['Dynamic pricing optimization', 'Ancillary revenue opportunities', 'Codeshare and partnership deals', 'Schedule optimization for connections'] },
        { name: 'Strategic Options', subPoints: ['Merger synergy potential', 'Fleet renewal business case', 'Labor negotiation strategy', '18-month implementation roadmap'] },
      ],
      explanation: 'This framework prioritizes quick-win route rationalization, then tackles the structural cost disadvantage through fleet and operations, identifies revenue upside, and evaluates longer-term strategic moves like mergers.',
    },
  },
  {
    id: 'market-entry-coffee',
    title: 'Coffee Chain Entering China',
    category: 'market-entry',
    difficulty: 'intermediate',
    prompt: 'Our client is a premium US-based coffee chain with 500 locations across North America. They are considering entering the Chinese market, where coffee consumption is growing at 15% annually. The CEO wants to know whether they should enter China, and if so, what their strategy should be. How would you approach this?',
    clarifyingQuestions: [
      { question: 'What is the size of the Chinese coffee market?', answer: 'The Chinese coffee market is approximately $12 billion annually, growing at about 15% per year. It is expected to reach $20 billion within 5 years.' },
      { question: 'Who are the main competitors in China?', answer: 'Starbucks dominates premium coffee with about 6,000 stores. Luckin Coffee is the largest local player with over 10,000 locations, primarily focused on convenience and delivery.' },
      { question: 'What is the client revenue model?', answer: 'Average ticket is $6 in the US. They are known for a premium sit-down experience with specialty drinks. About 70% of revenue is beverages, 30% food.' },
      { question: 'Does the client have international experience?', answer: 'They have 30 locations in Canada but no experience outside North America. They have no existing supply chain or brand recognition in Asia.' },
    ],
    exampleFramework: {
      buckets: [
        { name: 'Market Attractiveness', subPoints: ['Market size and growth trajectory', 'Consumer segments and preferences', 'Regulatory environment', 'Cultural fit for premium coffee'] },
        { name: 'Competitive Landscape', subPoints: ['Starbucks positioning and vulnerabilities', 'Luckin Coffee and local competitors', 'White space opportunities', 'Barriers to entry'] },
        { name: 'Entry Strategy', subPoints: ['Organic build vs. JV vs. acquisition', 'City prioritization and rollout plan', 'Product and menu localization', 'Digital and delivery strategy'] },
        { name: 'Financial Viability', subPoints: ['Required investment and timeline', 'Unit economics in China', 'Path to breakeven', 'Risk factors and mitigation'] },
      ],
      explanation: 'This framework assesses market opportunity, evaluates competitive dynamics, determines the best mode of entry, and validates financial viability before committing resources.',
    },
  },
  {
    id: 'ma-telehealth',
    title: 'Hospital Acquiring Telehealth Startup',
    category: 'ma',
    difficulty: 'advanced',
    prompt: 'Our client is a large hospital network with 25 hospitals across the Southeastern United States. They are considering acquiring a telehealth startup that has 500,000 active users and generates $40 million in annual revenue. The asking price is $200 million. The client wants to know if this is a good acquisition and what price they should be willing to pay. How would you evaluate this deal?',
    clarifyingQuestions: [
      { question: 'What is the telehealth startup profitability?', answer: 'The startup is currently unprofitable with an EBITDA margin of negative 10%. They are spending heavily on customer acquisition and technology development. They project breakeven in 18 months.' },
      { question: 'What is the strategic rationale?', answer: 'The client sees telehealth as critical for patient retention and wants to offer virtual care as a feeder system for in-person hospital visits for complex procedures.' },
      { question: 'What is the competitive landscape for telehealth?', answer: 'Teladoc and Amwell are the largest players. Most major hospital systems are building or buying telehealth capabilities. First-mover advantage is diminishing.' },
      { question: 'What are comparable deal multiples?', answer: 'Recent telehealth acquisitions have been done at 8-12x revenue for growing platforms. The asking price of $200M implies a 5x revenue multiple.' },
    ],
    exampleFramework: {
      buckets: [
        { name: 'Standalone Valuation', subPoints: ['DCF of projected cash flows', 'Comparable transaction multiples', 'Revenue growth sustainability', 'Path to profitability timeline'] },
        { name: 'Strategic Synergies', subPoints: ['Patient referral revenue potential', 'Reduced no-show rates', 'Data and analytics value', 'Competitive positioning'] },
        { name: 'Integration Risks', subPoints: ['Technology platform compatibility', 'Regulatory and compliance (HIPAA)', 'Cultural fit and talent retention', 'User migration and adoption'] },
        { name: 'Deal Structure', subPoints: ['Maximum willingness to pay', 'Earnout provisions tied to growth', 'Alternative build vs. buy analysis', 'Financing considerations'] },
      ],
      explanation: 'This framework values the target standalone, quantifies synergies that justify a premium, assesses integration risks that could destroy value, and determines the right price and structure.',
    },
  },
  {
    id: 'pricing-saas',
    title: 'SaaS Pricing Strategy',
    category: 'pricing',
    difficulty: 'intermediate',
    prompt: 'Our client is a B2B SaaS company that provides project management software to mid-market companies. They currently charge a flat fee of $500 per month regardless of company size or usage. Their growth has stalled at about 2,000 customers, and they believe their pricing model may be holding them back. They want us to help them rethink their pricing strategy. How would you approach this?',
    clarifyingQuestions: [
      { question: 'What is the current annual revenue and churn rate?', answer: 'Annual revenue is $12 million. Monthly churn is about 3%, which is higher than the industry average of 1.5%.' },
      { question: 'What does the customer base look like?', answer: 'Customers range from 10-person teams to 500-person departments. About 60% are small teams under 50, 30% mid-size 50-200, and 10% large 200+.' },
      { question: 'How does pricing compare to competitors?', answer: 'Most competitors use per-seat pricing ranging from $10-30 per user per month. The flat fee is cheaper for large teams but expensive for small teams.' },
      { question: 'What features do customers value most?', answer: 'Large customers value advanced analytics and integrations. Small customers primarily use basic task management and collaboration features.' },
    ],
    exampleFramework: {
      buckets: [
        { name: 'Current State Diagnosis', subPoints: ['Revenue per customer segment', 'Churn analysis by company size', 'Feature usage patterns', 'Price sensitivity by segment'] },
        { name: 'Pricing Model Options', subPoints: ['Per-seat pricing', 'Tiered pricing (good/better/best)', 'Usage-based pricing', 'Hybrid models'] },
        { name: 'Value-Based Analysis', subPoints: ['Willingness to pay by segment', 'Competitive benchmarking', 'Value delivered vs. price charged', 'Feature-to-tier mapping'] },
        { name: 'Implementation Plan', subPoints: ['Migration strategy for existing customers', 'Grandfathering vs. immediate switch', 'Revenue impact modeling', 'Communication and change management'] },
      ],
      explanation: 'This framework diagnoses why current pricing is causing churn, evaluates alternative models, determines optimal price points based on value, and plans a safe transition.',
    },
  },
  {
    id: 'ops-ecommerce',
    title: 'E-commerce Fulfillment Optimization',
    category: 'operations',
    difficulty: 'beginner',
    prompt: 'Our client is a direct-to-consumer e-commerce company that sells athletic apparel. Over the past year, their average delivery time has increased from 3 days to 7 days, and customer complaints about late deliveries have tripled. The COO wants to understand what is causing the delays and how to fix them. How would you structure your analysis?',
    clarifyingQuestions: [
      { question: 'How many fulfillment centers do they operate?', answer: 'They have 2 fulfillment centers, one on the East Coast and one on the West Coast. The East Coast facility handles 65% of orders.' },
      { question: 'Has order volume changed?', answer: 'Order volume has increased 40% year over year, but fulfillment center capacity has not been expanded. They are running at approximately 95% capacity.' },
      { question: 'What shipping carriers do they use?', answer: 'They use a single carrier for 90% of shipments. That carrier has raised rates 20% and has been experiencing service delays in certain regions.' },
      { question: 'Have there been any changes to product mix?', answer: 'Yes, they launched a customization option 6 months ago that requires additional processing time. Customized orders now represent 25% of total orders.' },
    ],
    exampleFramework: {
      buckets: [
        { name: 'Capacity Analysis', subPoints: ['Current vs. required throughput', 'Bottleneck identification', 'Peak period stress testing', 'Expansion options and timeline'] },
        { name: 'Process Efficiency', subPoints: ['Order processing workflow', 'Customization handling impact', 'Pick/pack/ship optimization', 'Technology and automation gaps'] },
        { name: 'Carrier Strategy', subPoints: ['Single carrier risk assessment', 'Multi-carrier diversification', 'Regional carrier options', 'Rate negotiation leverage'] },
        { name: 'Network Design', subPoints: ['Geographic coverage gaps', 'Third fulfillment center business case', '3PL partnership options', 'Inventory positioning strategy'] },
      ],
      explanation: 'This framework examines internal capacity constraints, process inefficiencies from the new customization offering, external carrier dependencies, and the overall network design to identify both quick wins and structural improvements.',
    },
  },
  {
    id: 'profit-retailer',
    title: 'Retail Profit Decline',
    category: 'profitability',
    difficulty: 'beginner',
    prompt: 'Our client is a mid-size national retailer with about 200 stores across the US. Over the past two years, their profits have declined by roughly 15%, even though revenues have remained relatively flat. The CEO has brought us in to figure out what is driving the profit decline and recommend actions to reverse it. How would you approach this problem?',
    clarifyingQuestions: [
      { question: 'What types of products does the retailer sell?', answer: 'They sell a mix of apparel, home goods, and electronics. Apparel is about 50% of revenue, home goods 30%, and electronics 20%.' },
      { question: 'Has the competitive landscape changed?', answer: 'Yes, two major e-commerce competitors have entered the market in the last 18 months, primarily competing on price in the electronics category.' },
      { question: 'Have there been any changes to the cost structure?', answer: 'Wages have increased about 8% due to new minimum wage laws in several states, and shipping costs are up roughly 12% due to supply chain disruptions.' },
      { question: 'Are all stores experiencing the same decline?', answer: 'No. About 60 stores in urban areas are performing well. The decline is concentrated in suburban and rural locations.' },
    ],
    exampleFramework: {
      buckets: [
        { name: 'Revenue Analysis', subPoints: ['Revenue by product category trends', 'Price vs. volume changes', 'Customer traffic and conversion rates', 'Same-store sales analysis'] },
        { name: 'Cost Analysis', subPoints: ['COGS trends by category', 'Labor cost increases', 'Supply chain and logistics costs', 'Rent and occupancy costs'] },
        { name: 'Competitive Dynamics', subPoints: ['E-commerce competitor impact', 'Pricing pressure by category', 'Customer switching behavior', 'Market share trends'] },
        { name: 'Store Portfolio', subPoints: ['Performance by geography', 'Underperforming store identification', 'Store closure vs. repositioning', 'Format optimization opportunities'] },
      ],
      explanation: 'This framework separates revenue and cost analysis to pinpoint the profit gap, examines competitive threats driving revenue pressure, and evaluates the store portfolio to find where the decline is concentrated.',
    },
  },
];
