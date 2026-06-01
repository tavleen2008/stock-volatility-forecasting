"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchNewsController = void 0;
const news_service_1 = require("./news.service");
const news_schemas_1 = require("./news.schemas");
const fetchNewsController = async (req, res) => {
    const { symbol, page, limit } = news_schemas_1.newsQuerySchema.parse({ symbol: req.params.symbol, ...req.query });
    const news = await (0, news_service_1.fetchNewsForSymbolFromDb)(symbol, limit, page);
    if (news.length === 0) {
        return res.status(404).json({ message: symbol ? `No news found for ${symbol}` : 'No news found' });
    }
    res.json(news);
};
exports.fetchNewsController = fetchNewsController;
