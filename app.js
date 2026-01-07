const { useState, useEffect } = React;
const { RefreshCw, TrendingUp, DollarSign, AlertCircle } = lucide;

const SportsArbAnalyzer = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filters, setFilters] = useState({
    sport: 'all',
    minProfit: 0
  });

  const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetRivers'];
  
  const generateMockOdds = () => {
    const sports = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer'];
    const teams = {
      NFL: [['Chiefs', 'Bills'], ['49ers', 'Eagles'], ['Cowboys', 'Packers']],
      NBA: [['Lakers', 'Celtics'], ['Warriors', 'Nets'], ['Bucks', 'Heat']],
      MLB: [['Yankees', 'Red Sox'], ['Dodgers', 'Giants'], ['Astros', 'Rangers']],
      NHL: [['Bruins', 'Maple Leafs'], ['Avalanche', 'Golden Knights'], ['Panthers', 'Lightning']],
      Soccer: [['Man City', 'Arsenal'], ['Real Madrid', 'Barcelona'], ['Bayern', 'Dortmund']]
    };

    const mockData = [];
    
    sports.forEach(sport => {
      teams[sport].forEach(matchup => {
        const game = {
          sport,
          team1: matchup[0],
          team2: matchup[1],
          odds: {}
        };

        sportsbooks.forEach(book => {
          const baseOdds1 = -110 + Math.random() * 40 - 20;
          const baseOdds2 = -110 + Math.random() * 40 - 20;
          
          game.odds[book] = {
            team1: Math.round(baseOdds1),
            team2: Math.round(baseOdds2)
          };
        });

        mockData.push(game);
      });
    });

    return mockData;
  };

  const americanToDecimal = (odds) => {
    if (odds > 0) {
      return (odds / 100) + 1;
    } else {
      return (100 / Math.abs(odds)) + 1;
    }
  };

  const calculateImpliedProbability = (odds) => {
    const decimal = americanToDecimal(odds);
    return 1 / decimal;
  };

  const findArbitrageOpportunities = (games) => {
    const arbs = [];

    games.forEach(game => {
      let bestOdds1 = { odds: -Infinity, book: '', decimal: 0 };
      let bestOdds2 = { odds: -Infinity, book: '', decimal: 0 };

      Object.entries(game.odds).forEach(([book, odds]) => {
        const decimal1 = americanToDecimal(odds.team1);
        const decimal2 = americanToDecimal(odds.team2);

        if (decimal1 > bestOdds1.decimal) {
          bestOdds1 = { odds: odds.team1, book, decimal: decimal1 };
        }
        if (decimal2 > bestOdds2.decimal) {
          bestOdds2 = { odds: odds.team2, book, decimal: decimal2 };
        }
      });

      const prob1 = calculateImpliedProbability(bestOdds1.odds);
      const prob2 = calculateImpliedProbability(bestOdds2.odds);
      const totalProb = prob1 + prob2;

      if (totalProb < 1) {
        const profitMargin = ((1 / totalProb) - 1) * 100;
        
        arbs.push({
          sport: game.sport,
          matchup: `${game.team1} vs ${game.team2}`,
          team1: game.team1,
          team2: game.team2,
          bet1: {
            team: game.team1,
            odds: bestOdds1.odds,
            book: bestOdds1.book,
            stake: (prob1 / totalProb * 100).toFixed(2)
          },
          bet2: {
            team: game.team2,
            odds: bestOdds2.odds,
            book: bestOdds2.book,
            stake: (prob2 / totalProb * 100).toFixed(2)
          },
          profitMargin: profitMargin.toFixed(2)
        });
      }
    });

    return arbs.sort((a, b) => b.profitMargin - a.profitMargin);
  };

  const fetchOpportunities = () => {
    setLoading(true);
    
    setTimeout(() => {
      const games = generateMockOdds();
      const arbs = findArbitrageOpportunities(games);
      setOpportunities(arbs);
      setLastUpdate(new Date());
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const filteredOpportunities = opportunities.filter(opp => {
    if (filters.sport !== 'all' && opp.sport !== filters.sport) return false;
    if (parseFloat(opp.profitMargin) < filters.minProfit) return false;
    return true;
  });

  const formatOdds = (odds) => {
    return odds > 0 ? `+${odds}` : odds;
  };

  return React.createElement('div', { 
    className: "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6" 
  },
    React.createElement('div', { className: "max-w-7xl mx-auto" },
      React.createElement('div', { className: "mb-8" },
        React.createElement('div', { className: "flex items-center justify-between mb-4" },
          React.createElement('div', null,
            React.createElement('h1', { className: "text-4xl font-bold mb-2" }, '⚡ Sports Arbitrage Analyzer'),
            React.createElement('p', { className: "text-slate-400" }, 'Real-time arbitrage opportunities across major sportsbooks')
          ),
          React.createElement('button', {
            onClick: fetchOpportunities,
            disabled: loading,
            className: "bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-colors"
          }, loading ? '🔄 Loading...' : '🔄 Refresh')
        ),
        lastUpdate && React.createElement('p', { className: "text-sm text-slate-400" },
          `Last updated: ${lastUpdate.toLocaleTimeString()}`
        )
      ),
      
      React.createElement('div', { className: "bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700" },
        React.createElement('h2', { className: "text-xl font-semibold mb-4" }, 'Filters'),
        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium mb-2" }, 'Sport'),
            React.createElement('select', {
              value: filters.sport,
              onChange: (e) => setFilters({...filters, sport: e.target.value}),
              className: "w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            },
              React.createElement('option', { value: "all" }, 'All Sports'),
              React.createElement('option', { value: "NFL" }, 'NFL'),
              React.createElement('option', { value: "NBA" }, 'NBA'),
              React.createElement('option', { value: "MLB" }, 'MLB'),
              React.createElement('option', { value: "NHL" }, 'NHL'),
              React.createElement('option', { value: "Soccer" }, 'Soccer')
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium mb-2" }, 'Minimum Profit Margin (%)'),
            React.createElement('input', {
              type: "number",
              value: filters.minProfit,
              onChange: (e) => setFilters({...filters, minProfit: parseFloat(e.target.value) || 0}),
              className: "w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500",
              step: "0.1",
              min: "0"
            })
          )
        )
      ),

      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-6" },
        React.createElement('div', { className: "bg-slate-800 rounded-lg p-6 border border-slate-700" },
          React.createElement('p', { className: "text-slate-400 text-sm" }, 'Total Opportunities'),
          React.createElement('p', { className: "text-3xl font-bold mt-1" }, filteredOpportunities.length)
        ),
        React.createElement('div', { className: "bg-slate-800 rounded-lg p-6 border border-slate-700" },
          React.createElement('p', { className: "text-slate-400 text-sm" }, 'Best Margin'),
          React.createElement('p', { className: "text-3xl font-bold mt-1 text-green-400" },
            filteredOpportunities.length > 0 ? `${filteredOpportunities[0].profitMargin}%` : '0%'
          )
        ),
        React.createElement('div', { className: "bg-slate-800 rounded-lg p-6 border border-slate-700" },
          React.createElement('p', { className: "text-slate-400 text-sm" }, 'Avg Profit Margin'),
          React.createElement('p', { className: "text-3xl font-bold mt-1 text-yellow-400" },
            filteredOpportunities.length > 0 
              ? `${(filteredOpportunities.reduce((sum, opp) => sum + parseFloat(opp.profitMargin), 0) / filteredOpportunities.length).toFixed(2)}%`
              : '0%'
          )
        )
      ),

      React.createElement('div', { className: "space-y-4" },
        loading ? 
          React.createElement('div', { className: "bg-slate-800 rounded-lg p-12 border border-slate-700 text-center" },
            React.createElement('p', { className: "text-xl" }, '🔄 Analyzing odds across sportsbooks...')
          )
        : filteredOpportunities.length === 0 ?
          React.createElement('div', { className: "bg-slate-800 rounded-lg p-12 border border-slate-700 text-center" },
            React.createElement('p', { className: "text-xl" }, '⚠️ No arbitrage opportunities found'),
            React.createElement('p', { className: "text-slate-400 mt-2" }, 'Try adjusting your filters or refresh to check again')
          )
        : filteredOpportunities.map((opp, idx) =>
            React.createElement('div', { 
              key: idx,
              className: "bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-green-500 transition-colors"
            },
              React.createElement('div', { className: "flex items-start justify-between mb-4" },
                React.createElement('div', null,
                  React.createElement('span', { 
                    className: "inline-block bg-blue-600 text-xs font-semibold px-3 py-1 rounded-full mb-2" 
                  }, opp.sport),
                  React.createElement('h3', { className: "text-xl font-bold" }, opp.matchup)
                ),
                React.createElement('div', { className: "text-right" },
                  React.createElement('p', { className: "text-sm text-slate-400" }, 'Profit Margin'),
                  React.createElement('p', { className: "text-2xl font-bold text-green-400" }, `${opp.profitMargin}%`)
                )
              ),
              React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                React.createElement('div', { className: "bg-slate-700 rounded-lg p-4 border-l-4 border-green-400" },
                  React.createElement('p', { className: "text-sm text-slate-400 mb-1" }, 'BET 1'),
                  React.createElement('p', { className: "text-lg font-semibold mb-2" }, opp.bet1.team),
                  React.createElement('div', { className: "flex items-center justify-between text-sm" },
                    React.createElement('span', { className: "text-slate-300" }, opp.bet1.book),
                    React.createElement('span', { className: "font-bold text-green-400" }, formatOdds(opp.bet1.odds))
                  ),
                  React.createElement('p', { className: "text-sm text-slate-400 mt-2" }, 
                    `Stake: ${opp.bet1.stake}% of bankroll`
                  )
                ),
                React.createElement('div', { className: "bg-slate-700 rounded-lg p-4 border-l-4 border-blue-400" },
                  React.createElement('p', { className: "text-sm text-slate-400 mb-1" }, 'BET 2'),
                  React.createElement('p', { className: "text-lg font-semibold mb-2" }, opp.bet2.team),
                  React.createElement('div', { className: "flex items-center justify-between text-sm" },
                    React.createElement('span', { className: "text-slate-300" }, opp.bet2.book),
                    React.createElement('span', { className: "font-bold text-blue-400" }, formatOdds(opp.bet2.odds))
                  ),
                  React.createElement('p', { className: "text-sm text-slate-400 mt-2" }, 
                    `Stake: ${opp.bet2.stake}% of bankroll`
                  )
                )
              )
            )
          )
      ),

      React.createElement('div', { className: "mt-8 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4" },
        React.createElement('p', { className: "text-sm text-yellow-200" },
          '⚠️ Disclaimer: This is a demonstration tool using simulated data. For production use, integrate with real sportsbook APIs. Always verify odds before placing bets. Gambling involves risk.'
        )
      )
    )
  );
};

ReactDOM.render(
  React.createElement(SportsArbAnalyzer),
  document.getElementById('root')
);
