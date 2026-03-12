---
layout: article
title: "Player Trading Systems"
description: "Auction houses, peer-to-peer trading, and fraud prevention — how games handle player-driven markets"
lang: en
level: intermediate
tags: ["Game Economy", "Trading Systems", "English Reading"]
series: game-economy
series_title: "Game Economy Design: English Reading"
title_suffix: "Game Economy Design: English Reading"
order: 4
prev:
  title: "Gacha and Probability"
  url: "03-gacha-and-probability.html"
next:
  title: "The Battle Pass Formula"
  url: "05-battle-pass.html"
---

In 2001, a player in RuneScape offered to "trim your armor for free." Thousands of new players handed over their gear. They never got it back. This simple scam revealed a deep truth: the moment you let players trade, you create an economy — and economies attract fraud.

## The Trading Spectrum

Not all games handle trading the same way. At one extreme, RuneScape and early Diablo allowed completely free peer-to-peer trading. Players could give any item to any other player, no restrictions. This created vibrant markets but also opened the door to scams and real-money trading.

At the other extreme, most modern gacha games like Genshin Impact allow zero trading. Every item is bound to your account. This kills fraud entirely but also kills player interaction. Between these two extremes, designers must choose their tradeoffs carefully.

> **Word Notes**
> - *vibrant* /ˈvaɪbrənt/ — 充满活力的。"A vibrant economy attracts more players to the game."
> - *fraud* /frɔːd/ — 欺诈，诈骗。"Online fraud costs the gaming industry billions each year."

## The Auction House Model

World of Warcraft popularized the auction house in 2004. Instead of shouting "selling iron sword, 5 gold" in a chat channel, players list items on a centralized marketplace. Buyers search, compare prices, and bid. The system handles the transaction automatically.

Guild Wars 2 improved this with its Trading Post. It introduced instant-buy and instant-sell options. If you want an item now, you pay the lowest listed price. If you want a better deal, you place a buy order and wait. This two-sided order book mirrors real stock exchanges. The game takes a 15% fee on every sale. That fee is an important gold sink — it removes currency from the economy and fights inflation.

> **Word Notes**
> - *bid* /bɪd/ — 出价，竞标。"She placed a bid of 200 gold on the rare mount."
> - *inflation* /ɪnˈfleɪʃn/ — 通货膨胀。"Without gold sinks, inflation makes everything unaffordable."

## The Diablo III Disaster

In 2012, Blizzard launched Diablo III with a real-money auction house (RMAH). Players could sell in-game items for actual US dollars. Blizzard took a $1 flat fee plus 15% from each transaction. The idea seemed brilliant: legitimize the black market and take a cut.

It failed catastrophically. Players spent more time browsing the auction house than playing the game. The best items cost $250. Drop rates were tuned low to keep items valuable on the market. The game felt like work, not fun. Blizzard shut down the RMAH in March 2014. The lesson was clear: when real money dominates, gameplay suffers.

## Fighting Fraud and RMT

Real money trading (RMT) exists in almost every game with trading. Gold farmers in World of Warcraft earned roughly $1 billion per year at the industry's peak. Games fight back with several tools.

Trade restrictions are the simplest defense. Many games require items to become "bound" after equipping them. Some impose a minimum level before trading unlocks. Others limit how much gold a new account can send per day.

Escrow systems protect both parties in a trade. The system holds both items until both players confirm. This prevents the classic "drop your item first" scam.

Monitoring algorithms flag suspicious patterns. If one account sends 10,000 gold to 50 different accounts in one day, it is probably a gold seller. Automated detection can ban these accounts within hours.

> **Word Notes**
> - *escrow* /ˈeskroʊ/ — 第三方托管。"The escrow system holds payment until both sides are satisfied."
> - *legitimize* /lɪˈdʒɪtɪmaɪz/ — 使合法化。"Some games try to legitimize RMT by offering official channels."

## Finding the Balance

Modern games increasingly adopt hybrid approaches. Final Fantasy XIV allows trading but binds high-end gear. Eve Online embraces full free trade and accepts the chaos. Warframe lets players trade premium currency, creating a player-driven market without a traditional auction house.

The best system depends on the game's goals. A competitive PvP game needs tight restrictions to prevent pay-to-win. A sandbox MMO thrives on economic freedom. There is no universal answer — only tradeoffs.

*Every trading system is a bet: how much freedom can your players handle before the economy breaks?*
