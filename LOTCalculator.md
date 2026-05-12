Dưới đây là **prompt hoàn chỉnh** để bạn copy đưa cho Codex thực hiện dự án.

---

# **Prompt tổng cho Codex**

Bạn là một senior full-stack TypeScript engineer, web scraping engineer và quantitative trading tool developer.

Hãy xây dựng một web app production-ready tên là:

FTMO Crypto Lot Calculator

Mục tiêu:  
Web app giúp trader tính toán khối lượng giao dịch dạng lot trên MT5/FTMO cho các cặp crypto CFD. Người dùng chỉ cần nhập các thông số cơ bản:

1\. Account Balance  
2\. Risk % hoặc Risk $  
3\. Symbol  
4\. Entry Price  
5\. Stop Loss Price  
6\. Direction: Long hoặc Short

Hệ thống phía sau sẽ tự lấy hoặc cache các thông số kỹ thuật cần thiết từ FTMO Symbols page, bao gồm:

1\. Contract Size  
2\. Tick Size  
3\. Tick Value  
4\. Min Lot  
5\. Max Lot  
6\. Lot Step  
7\. Commission nếu có

Yêu cầu quan trọng:  
Không được bắt người dùng nhập Tick Size, Tick Value, Lot Step, Min Lot, Max Lot trong form chính.  
Những thông số này phải được lấy từ cache/database symbol specs.  
Nếu thiếu dữ liệu quan trọng, hệ thống phải hiển thị cảnh báo và cho phép manual override.

Tech stack bắt buộc:  
\- Next.js App Router  
\- TypeScript  
\- TailwindCSS  
\- shadcn/ui  
\- React Hook Form  
\- Zod  
\- Vitest  
\- localStorage cho user preferences và manual overrides  
\- JSON cache cho MVP  
\- Không dùng database ở phiên bản đầu tiên

Các trang cần có:  
1\. Home page: calculator chính  
2\. Symbols page: bảng thông số symbol  
3\. Admin page: refresh dữ liệu từ FTMO Symbols page

Các API cần có:  
1\. GET /api/symbols  
2\. GET /api/symbols?assetClass=crypto  
3\. GET /api/symbols/\[symbol\]  
4\. POST /api/symbols/refresh

Luồng dữ liệu:  
FTMO Symbols Page  
→ scraper lấy dữ liệu  
→ parser xử lý raw data  
→ normalizer chuẩn hóa dữ liệu  
→ validator kiểm tra dữ liệu có đủ để tính lot không  
→ lưu vào JSON cache  
→ calculator dùng cache để tính lot

Không được để calculator gọi trực tiếp live FTMO mỗi lần người dùng tính toán.  
Calculator chỉ được dùng dữ liệu đã cache và validated.

Nếu scraper lỗi:  
\- Không được crash app  
\- Dùng cache cũ nếu có  
\- Hiển thị warning rằng dữ liệu chưa được cập nhật mới nhất

Nếu symbol thiếu Tick Size, Tick Value, Lot Step, Min Lot hoặc Max Lot:  
\- Không được tính lot một cách đoán mò  
\- Hiển thị cảnh báo  
\- Cho phép user nhập manual override

---

# **Công thức tính lot**

riskAmount \= accountBalance \* riskPercent / 100

priceDistance \= abs(entryPrice \- stopLossPrice)

ticksCount \= priceDistance / tickSize

lossPerOneLot \= ticksCount \* tickValue

rawLot \= riskAmount / lossPerOneLot

roundedLot \= floor(rawLot / lotStep) \* lotStep

Nếu người dùng nhập Risk $ thay vì Risk %:

riskAmount \= fixedRiskAmount

Validation direction:

Nếu Direction \= Long:  
Stop Loss Price phải nhỏ hơn Entry Price

Nếu Direction \= Short:  
Stop Loss Price phải lớn hơn Entry Price

---

# **Commission logic**

Hỗ trợ 3 loại commission:

none  
fixed\_per\_lot  
percent\_notional

Nếu commission type là `fixed_per_lot`:

totalRiskPerLot \= lossPerOneLot \+ commissionValue  
rawLot \= riskAmount / totalRiskPerLot

Nếu commission type là `percent_notional`:

notional \= lot \* contractSize \* entryPrice

commissionOneSide \= notional \* commissionValue

roundTurnCommission \= commissionOneSide \* 2

Vì commission dạng percent\_notional phụ thuộc vào lot, engine phải tính theo hướng bảo thủ:

1. Tính raw lot chưa gồm commission  
2. Làm tròn xuống theo lot step  
3. Tính estimated loss \+ commission  
4. Nếu total risk \> intended risk thì giảm lot từng bước theo lotStep cho đến khi total risk \<= intended risk

Không được để estimated total risk vượt quá riskAmount nếu includeCommission \= true.

---

# **Cấu trúc thư mục yêu cầu**

/src/app  
/src/app/page.tsx  
/src/app/symbols/page.tsx  
/src/app/admin/page.tsx

/src/app/api/symbols/route.ts  
/src/app/api/symbols/\[symbol\]/route.ts  
/src/app/api/symbols/refresh/route.ts

/src/components  
/src/components/calculator  
/src/components/calculator/CalculatorForm.tsx  
/src/components/calculator/ResultPanel.tsx

/src/components/symbols  
/src/components/symbols/SymbolSpecTable.tsx  
/src/components/symbols/ManualSymbolOverride.tsx  
/src/components/symbols/SymbolSpecStatus.tsx

/src/components/admin  
/src/components/admin/RefreshFTMODataButton.tsx

/src/lib  
/src/lib/ftmo  
/src/lib/ftmo/scrapeFTMOSymbols.ts  
/src/lib/ftmo/parseFTMOSymbols.ts  
/src/lib/ftmo/normalizeFTMOSymbol.ts  
/src/lib/ftmo/validateSymbolSpec.ts  
/src/lib/ftmo/symbolCache.ts

/src/lib/trading  
/src/lib/trading/calculateLotSize.ts  
/src/lib/trading/calculateCommission.ts  
/src/lib/trading/roundLot.ts

/src/types  
/src/types/symbol.ts  
/src/types/calculator.ts

/src/data  
/src/data/ftmo-symbols-cache.json  
/src/data/seed-ftmo-crypto-symbols.json

/src/tests

---

# **Type system yêu cầu**

Tạo file:

/src/types/symbol.ts

Nội dung type chính:

export type AssetClass \=  
  | "crypto"  
  | "forex"  
  | "indices"  
  | "metals"  
  | "commodities"  
  | "stocks";

export type TradingPlatform \=  
  | "MT5"  
  | "MT4"  
  | "cTrader"  
  | "DXtrade"  
  | "unknown";

export type CommissionType \=  
  | "none"  
  | "fixed\_per\_lot"  
  | "percent\_notional"  
  | "unknown";

export type SymbolDataSource \=  
  | "ftmo\_symbols\_page"  
  | "manual"  
  | "mt5\_export"  
  | "seed";

export type FTMOSymbolSpec \= {  
  symbol: string;  
  displayName?: string;  
  assetClass: AssetClass;  
  platform: TradingPlatform;

  contractSize?: number;  
  tickSize?: number;  
  tickValue?: number;  
  minLot?: number;  
  maxLot?: number;  
  lotStep?: number;

  commissionType?: CommissionType;  
  commissionValue?: number;  
  commissionCurrency?: string;

  profitCurrency?: string;  
  marginCurrency?: string;

  tradingHours?: string;

  source: SymbolDataSource;  
  sourceUrl?: string;

  lastFetchedAt?: string;  
  lastVerifiedAt?: string;

  isCompleteForCalculation: boolean;  
  warnings: string\[\];  
};

Tạo file:

/src/types/calculator.ts

Nội dung:

export type Direction \= "long" | "short";

export type RiskMode \= "percent" | "fixed";

export type LotCalculationInput \= {  
  accountBalance: number;  
  riskMode: RiskMode;  
  riskPercent?: number;  
  riskAmount?: number;  
  symbol: string;  
  direction: Direction;  
  entryPrice: number;  
  stopLossPrice: number;  
  includeCommission: boolean;  
};

export type LotCalculationResult \= {  
  symbol: string;  
  riskAmount: number;  
  priceDistance: number;  
  ticksCount: number;  
  lossPerOneLot: number;  
  rawLot: number;  
  roundedLot: number;  
  finalLot: number;  
  estimatedLoss: number;  
  estimatedCommission: number;  
  totalEstimatedRisk: number;  
  effectiveRiskPercent: number;  
  warnings: string\[\];  
};

---

# **Scraper yêu cầu**

Tạo file:

/src/lib/ftmo/scrapeFTMOSymbols.ts

Yêu cầu:

1\. Fetch FTMO Symbols page.  
2\. Parse dữ liệu symbol nếu có.  
3\. Tập trung vào crypto symbols.  
4\. Return raw records, chưa normalize vội.  
5\. Có sourceUrl.  
6\. Có fetchedAt timestamp.  
7\. Nếu HTML thay đổi hoặc thiếu dữ liệu, return partial data kèm warnings.  
8\. Không được crash app.  
9\. Không được invent dữ liệu bị thiếu.  
10\. Không test live scraper trong unit test.

Raw type có thể là:

export type RawFTMOSymbolRecord \= {  
  symbol?: string;  
  displayName?: string;  
  assetClass?: string;  
  platform?: string;  
  rawContractSize?: string;  
  rawTickSize?: string;  
  rawTickValue?: string;  
  rawMinLot?: string;  
  rawMaxLot?: string;  
  rawLotStep?: string;  
  rawCommission?: string;  
  rawTradingHours?: string;  
  sourceUrl: string;  
  fetchedAt: string;  
  warnings: string\[\];  
};

---

# **Normalizer yêu cầu**

Tạo các file:

/src/lib/ftmo/parseFTMOSymbols.ts  
/src/lib/ftmo/normalizeFTMOSymbol.ts  
/src/lib/ftmo/validateSymbolSpec.ts

Yêu cầu:

1\. Chuyển raw string thành number.  
2\. Chuẩn hóa symbol thành BTCUSD, ETHUSD, SOLUSD...  
3\. Xác định assetClass \= crypto cho các crypto symbols.  
4\. Xác định platform nếu scrape được, nếu không thì unknown.  
5\. Parse commission:  
   \- Nếu không có thì none hoặc unknown  
   \- Nếu có % thì percent\_notional  
   \- Nếu có fixed amount thì fixed\_per\_lot  
6\. Validate symbol có đủ để tính toán hay không.

Một symbol chỉ được coi là `isCompleteForCalculation = true` nếu:

tickSize \> 0  
tickValue \> 0  
lotStep \> 0  
minLot \> 0  
maxLot \>= minLot

Nếu thiếu bất cứ field nào, thêm warning rõ ràng:

Missing tick value  
Missing tick size  
Missing lot step  
Missing min lot  
Missing max lot

---

# **Cache layer yêu cầu**

Tạo file:

/src/lib/ftmo/symbolCache.ts

Yêu cầu:

1\. Đọc cache từ /src/data/ftmo-symbols-cache.json  
2\. Đọc seed fallback từ /src/data/seed-ftmo-crypto-symbols.json  
3\. Nếu cache tồn tại, ưu tiên cache  
4\. Nếu cache không tồn tại, dùng seed  
5\. Nếu refresh thành công, update cache  
6\. Nếu refresh thất bại, giữ cache cũ  
7\. Return metadata:  
   \- lastFetchedAt  
   \- source  
   \- numberOfSymbols  
   \- completeSymbols  
   \- incompleteSymbols  
   \- warnings

Lưu ý:  
Ở MVP dùng JSON cache.  
Thêm comment rõ rằng nếu deploy production trên Vercel serverless thì nên chuyển sang Supabase, Postgres, Redis hoặc KV vì runtime file write không bền vững.

---

# **API routes yêu cầu**

## **GET /api/symbols**

Return toàn bộ cached normalized symbol specs.  
Support query:  
\- assetClass=crypto  
\- completeOnly=true

## **GET /api/symbols/\[symbol\]**

Return một symbol theo symbol name.  
Nếu không tìm thấy, return 404 JSON.

## **POST /api/symbols/refresh**

Trigger scraper.  
Parse raw data.  
Normalize.  
Validate.  
Update cache nếu thành công.  
Return refresh summary.  
Nếu scrape fail, return cache cũ kèm warning.  
Không expose stack trace.

Response refresh nên có:

type RefreshResult \= {  
  success: boolean;  
  usedFallbackCache: boolean;  
  symbolsFound: number;  
  completeSymbols: number;  
  incompleteSymbols: number;  
  lastFetchedAt?: string;  
  warnings: string\[\];  
};

---

# **Trading calculation engine yêu cầu**

Tạo files:

/src/lib/trading/calculateLotSize.ts  
/src/lib/trading/calculateCommission.ts  
/src/lib/trading/roundLot.ts

## **roundLot**

roundLotDown(rawLot: number, lotStep: number): number

Yêu cầu:

\- Làm tròn xuống theo lotStep  
\- Tránh lỗi floating point  
\- Ví dụ:  
  rawLot \= 1.237, lotStep \= 0.01 → 1.23  
  rawLot \= 1.237, lotStep \= 0.1 → 1.2

## **calculateCommission**

Input:

lot  
contractSize  
entryPrice  
commissionType  
commissionValue

Output:

estimatedCommission

Logic:

none → 0

fixed\_per\_lot → lot \* commissionValue

percent\_notional →  
notional \= lot \* contractSize \* entryPrice  
commissionOneSide \= notional \* commissionValue  
roundTurnCommission \= commissionOneSide \* 2

Lưu ý:  
`commissionValue` dạng percent phải dùng decimal.  
Ví dụ 0.0325% thì lưu là:

0.000325

## **calculateLotSize**

Input:

LotCalculationInput  
FTMOSymbolSpec

Validation:

accountBalance \> 0  
riskAmount hoặc riskPercent \> 0  
entryPrice \> 0  
stopLossPrice \> 0  
entryPrice \!= stopLossPrice  
direction long thì SL \< Entry  
direction short thì SL \> Entry  
tickSize tồn tại và \> 0  
tickValue tồn tại và \> 0  
lotStep tồn tại và \> 0  
minLot tồn tại và \> 0  
maxLot tồn tại và \>= minLot

Output:

LotCalculationResult

Warnings:

Calculated lot is below min lot  
Calculated lot is above max lot  
Symbol specification is incomplete  
Stop loss direction does not match trade direction  
Estimated risk is lower than intended risk because lot was rounded down  
Estimated total risk exceeds intended risk  
Commission is unknown

Không được tính lot nếu thiếu field bắt buộc.

---

# **UI yêu cầu**

## **Home page**

Trang chính gồm:

Header:  
FTMO Crypto Lot Calculator

Main layout:  
Left side: Calculator Form  
Right side: Result Panel

Bottom:  
Symbol Data Status  
Risk Disclaimer

## **Calculator form**

Tạo:

/src/components/calculator/CalculatorForm.tsx

Fields:

Account Balance  
Risk Mode: Risk % hoặc Risk $  
Risk Value  
Symbol dropdown  
Direction: Long / Short  
Entry Price  
Stop Loss Price  
Include Commission checkbox

Yêu cầu:

1\. Dùng React Hook Form.  
2\. Dùng Zod validation.  
3\. Dùng shadcn/ui.  
4\. Load symbols từ /api/symbols?assetClass=crypto.  
5\. Chỉ show complete symbols mặc định.  
6\. Có toggle "Show incomplete symbols".  
7\. Nếu chọn incomplete symbol, show warning và mở manual override.  
8\. Tính live khi user nhập.  
9\. Save preferences vào localStorage:  
   \- accountBalance  
   \- riskMode  
   \- riskPercent  
   \- riskAmount  
   \- lastSelectedSymbol  
   \- includeCommission

## **Result panel**

Tạo:

/src/components/calculator/ResultPanel.tsx

Hiển thị:

Suggested Lot  
Raw Lot  
Rounded Lot  
Risk Amount  
Estimated Loss  
Estimated Commission  
Total Estimated Risk  
Effective Risk %  
Stop Loss Distance  
Tick Count  
Loss Per 1 Lot  
Min Lot  
Max Lot  
Lot Step  
Warnings

Yêu cầu:

1\. Suggested Lot phải nổi bật nhất.  
2\. Có nút copy final lot.  
3\. Nếu có warning, show bằng Alert.  
4\. Format số đẹp.  
5\. Mobile responsive.

---

# **Manual override yêu cầu**

Tạo:

/src/components/symbols/ManualSymbolOverride.tsx

Cho phép user override:

Contract Size  
Tick Size  
Tick Value  
Min Lot  
Max Lot  
Lot Step  
Commission Type  
Commission Value

Yêu cầu:

1\. Lưu override trong localStorage theo symbol.  
2\. Nếu override active, calculator dùng override.  
3\. Show badge: Manual override active.  
4\. Có nút reset override.  
5\. Có cảnh báo:  
   "Verify these values in FTMO MT5 Market Watch → Specification before live trading."

---

# **Symbols page yêu cầu**

Tạo:

/src/app/symbols/page.tsx  
/src/components/symbols/SymbolSpecTable.tsx

Bảng gồm columns:

Symbol  
Display Name  
Asset Class  
Platform  
Contract Size  
Tick Size  
Tick Value  
Min Lot  
Max Lot  
Lot Step  
Commission Type  
Commission Value  
Complete?  
Last Fetched  
Warnings

Filters:

Search symbol  
Crypto only  
Complete only  
Incomplete only

Yêu cầu:

1\. Highlight incomplete symbols.  
2\. Show warning per symbol.  
3\. Responsive table.  
4\. Show data freshness.

---

# **Admin page yêu cầu**

Tạo:

/src/app/admin/page.tsx  
/src/components/admin/RefreshFTMODataButton.tsx

Yêu cầu:

1\. Hiển thị cache metadata.  
2\. Có button refresh FTMO data.  
3\. Khi bấm button, gọi POST /api/symbols/refresh.  
4\. Hiển thị kết quả:  
   \- success/failure  
   \- symbolsFound  
   \- completeSymbols  
   \- incompleteSymbols  
   \- usedFallbackCache  
   \- warnings  
   \- lastFetchedAt  
5\. Nếu refresh fail, show rõ app đang dùng cache cũ.  
6\. Thêm disclaimer rằng scraped data phải được verify lại trong MT5.

---

# **Disclaimer bắt buộc**

Thêm disclaimer ở home page và symbols page:

This calculator is for estimation only.  
FTMO and MT5 symbol specifications may change.  
Always verify Contract Size, Tick Size, Tick Value, Min Lot, Max Lot, Lot Step and Commission directly in FTMO MT5 Market Watch → Specification before live trading.  
This is not financial advice.  
You are responsible for your own trading decisions and execution risk.

Có thể viết UI bằng tiếng Anh hoặc tiếng Việt, nhưng code/internal naming dùng tiếng Anh.

---

# **Seed data yêu cầu**

Tạo:

/src/data/seed-ftmo-crypto-symbols.json

Bao gồm các symbol crypto phổ biến dưới dạng placeholder:

BTCUSD  
ETHUSD  
SOLUSD  
XRPUSD  
ADAUSD  
DOGEUSD  
LTCUSD  
BNBUSD  
DOTUSD  
LINKUSD

Quan trọng:  
Nếu chưa có dữ liệu thật, các field như tickSize, tickValue, lotStep có thể để undefined/null.  
Không được bịa số liệu.  
Mỗi symbol placeholder phải có warning:

"Placeholder only. Verify with FTMO MT5 Specification."

---

# **Testing yêu cầu**

Dùng Vitest.

Test các phần:

1\. roundLotDown  
2\. calculateCommission none  
3\. calculateCommission fixed\_per\_lot  
4\. calculateCommission percent\_notional  
5\. calculateLotSize basic case  
6\. calculateLotSize with risk percent  
7\. calculateLotSize with fixed risk amount  
8\. long direction validation  
9\. short direction validation  
10\. missing tickSize  
11\. missing tickValue  
12\. missing lotStep  
13\. lot below minLot warning  
14\. lot above maxLot warning  
15\. commission included  
16\. commission excluded  
17\. normalizeFTMOSymbol  
18\. validateSymbolSpec  
19\. scraper failure fallback  
20\. cache fallback behavior

Không được gọi live FTMO website trong unit test.  
Mock scraper response.

---

# **UX/UI yêu cầu**

1\. Clean trading dashboard style.  
2\. Dark mode support.  
3\. Responsive mobile-first design.  
4\. Cards with clear spacing.  
5\. Suggested lot phải dễ nhìn.  
6\. Warning rõ ràng, không bị ẩn.  
7\. Loading state khi fetch symbols.  
8\. Empty state khi không có symbol.  
9\. Error state khi API lỗi.  
10\. Copy final lot button.  
11\. Data freshness indicator.

---

# **Build yêu cầu**

Sau khi hoàn thành:

npm run lint  
npm run test  
npm run build

Tất cả phải pass.

Nếu có lỗi, tự sửa đến khi pass.

---

# **Output mong muốn**

Hãy triển khai toàn bộ codebase theo yêu cầu trên.

Sau khi xong, trả lời với:

1. Danh sách file đã tạo/sửa  
2. Cách chạy project  
3. Cách refresh FTMO data  
4. Cách dùng manual override  
5. Các điểm cần verify trước khi live trading  
6. Kết quả test/build

\---

\# Prompt chia nhỏ theo từng task cho Codex

Nếu bạn muốn làm cẩn thận, hãy cho Codex làm theo từng task dưới đây thay vì đưa prompt tổng.

\---

\#\# Task 1 — Setup project

\`\`\`text  
Bạn là senior full-stack engineer.

Hãy setup project Next.js App Router với:  
\- TypeScript  
\- TailwindCSS  
\- shadcn/ui  
\- React Hook Form  
\- Zod  
\- Vitest

Tên project:  
FTMO Crypto Lot Calculator

Tạo cấu trúc thư mục:

/src/app  
/src/app/page.tsx  
/src/app/symbols/page.tsx  
/src/app/admin/page.tsx

/src/components/calculator  
/src/components/symbols  
/src/components/admin

/src/lib/ftmo  
/src/lib/trading

/src/types  
/src/data  
/src/tests

Tạo layout dashboard cơ bản:  
\- Header  
\- Navigation: Calculator, Symbols, Admin  
\- Main content area  
\- Responsive design  
\- Dark mode ready

Chưa cần implement logic tính lot hoặc scraper ở task này.

Đảm bảo npm run build pass.

---

## **Task 2 — Type system**

Bạn là senior TypeScript engineer.

Tạo type system cho project.

Files:  
\- /src/types/symbol.ts  
\- /src/types/calculator.ts

Cần có types:  
\- AssetClass  
\- TradingPlatform  
\- CommissionType  
\- SymbolDataSource  
\- FTMOSymbolSpec  
\- Direction  
\- RiskMode  
\- LotCalculationInput  
\- LotCalculationResult

FTMOSymbolSpec cần hỗ trợ dữ liệu scrape không đầy đủ, nên các trường kỹ thuật như contractSize, tickSize, tickValue, minLot, maxLot, lotStep phải optional.

Calculator chỉ được chạy nếu các field bắt buộc tồn tại.

Đảm bảo type rõ ràng, strict, maintainable.

---

## **Task 3 — Trading calculation engine**

Bạn là quantitative trading software engineer.

Implement engine tính lot cho MT5 CFD.

Files:  
\- /src/lib/trading/roundLot.ts  
\- /src/lib/trading/calculateCommission.ts  
\- /src/lib/trading/calculateLotSize.ts

Công thức:  
riskAmount \= accountBalance \* riskPercent / 100 nếu không dùng fixed risk  
priceDistance \= abs(entryPrice \- stopLossPrice)  
ticksCount \= priceDistance / tickSize  
lossPerOneLot \= ticksCount \* tickValue  
rawLot \= riskAmount / lossPerOneLot  
roundedLot \= floor(rawLot / lotStep) \* lotStep

Commission:  
Support:  
\- none  
\- fixed\_per\_lot  
\- percent\_notional

percent\_notional:  
notional \= lot \* contractSize \* entryPrice  
commissionOneSide \= notional \* commissionValue  
roundTurnCommission \= commissionOneSide \* 2

Nếu includeCommission \= true, final lot phải được giảm bảo thủ để totalEstimatedRisk \<= riskAmount.

Validation:  
\- accountBalance \> 0  
\- risk \> 0  
\- entryPrice \> 0  
\- stopLossPrice \> 0  
\- entryPrice \!= stopLossPrice  
\- long thì SL \< Entry  
\- short thì SL \> Entry  
\- tickSize \> 0  
\- tickValue \> 0  
\- lotStep \> 0  
\- minLot \> 0  
\- maxLot \>= minLot

Warnings:  
\- lot below minLot  
\- lot above maxLot  
\- estimated risk lower than intended due to rounding  
\- commission unknown  
\- symbol spec incomplete

Viết code sạch, có unit test bằng Vitest.

---

## **Task 4 — FTMO scraper raw fetch**

Bạn là web scraping engineer.

Implement scraper lấy dữ liệu từ FTMO Symbols page.

File:  
\- /src/lib/ftmo/scrapeFTMOSymbols.ts

Yêu cầu:  
1\. Fetch FTMO Symbols page.  
2\. Parse raw symbol data nếu có thể.  
3\. Ưu tiên crypto symbols.  
4\. Return RawFTMOSymbolRecord\[\].  
5\. Không normalize ở bước này.  
6\. Không invent dữ liệu thiếu.  
7\. Nếu FTMO page render bằng JS hoặc HTML không chứa đủ data, return partial data \+ warnings.  
8\. Nếu request fail, return structured error.  
9\. Không throw lỗi làm crash app.  
10\. Có sourceUrl và fetchedAt.

Tạo type RawFTMOSymbolRecord.

Không viết unit test gọi live FTMO.  
Các test phải mock HTML response.

---

## **Task 5 — Parser, normalizer, validator**

Bạn là data normalization engineer.

Implement:

/src/lib/ftmo/parseFTMOSymbols.ts  
/src/lib/ftmo/normalizeFTMOSymbol.ts  
/src/lib/ftmo/validateSymbolSpec.ts

Yêu cầu:  
1\. Parse numeric text thành number.  
2\. Normalize symbol names.  
3\. Detect crypto symbols.  
4\. Parse commission:  
   \- % → percent\_notional  
   \- fixed number → fixed\_per\_lot  
   \- missing → unknown hoặc none  
5\. Validate field bắt buộc.  
6\. Set isCompleteForCalculation \= true chỉ khi:  
   \- tickSize \> 0  
   \- tickValue \> 0  
   \- lotStep \> 0  
   \- minLot \> 0  
   \- maxLot \>= minLot  
7\. Nếu thiếu field, thêm warning.  
8\. Không được tự bịa số liệu thiếu.

Viết unit tests cho normalizer và validator.

---

## **Task 6 — Cache layer and API**

Bạn là Next.js backend engineer.

Implement cache layer và API routes.

Files:  
\- /src/lib/ftmo/symbolCache.ts  
\- /src/data/ftmo-symbols-cache.json  
\- /src/data/seed-ftmo-crypto-symbols.json  
\- /src/app/api/symbols/route.ts  
\- /src/app/api/symbols/\[symbol\]/route.ts  
\- /src/app/api/symbols/refresh/route.ts

Yêu cầu:  
1\. GET /api/symbols return cached symbols.  
2\. Support query assetClass=crypto.  
3\. Support query completeOnly=true.  
4\. GET /api/symbols/\[symbol\] return one symbol.  
5\. POST /api/symbols/refresh trigger scraper → normalize → validate → update cache.  
6\. Nếu refresh fail, dùng cache cũ.  
7\. Nếu cache không có, dùng seed data.  
8\. Không expose stack trace.  
9\. Response có metadata và warnings.

Seed data dùng placeholder, không bịa thông số thật.  
Mỗi placeholder phải có warning verify with FTMO MT5 Specification.

---

## **Task 7 — Calculator UI**

Bạn là frontend engineer.

Build calculator UI.

Files:  
\- /src/components/calculator/CalculatorForm.tsx  
\- /src/components/calculator/ResultPanel.tsx  
\- /src/app/page.tsx

Form chỉ gồm:  
1\. Account Balance  
2\. Risk Mode: Risk % hoặc Risk $  
3\. Risk Value  
4\. Symbol  
5\. Entry Price  
6\. Stop Loss Price  
7\. Direction  
8\. Include Commission checkbox

Yêu cầu:  
1\. Dùng React Hook Form.  
2\. Dùng Zod validation.  
3\. Dùng shadcn/ui.  
4\. Load symbols từ /api/symbols?assetClass=crypto.  
5\. Chỉ show complete symbols mặc định.  
6\. Có toggle show incomplete symbols.  
7\. Tính live khi user nhập đủ dữ liệu.  
8\. Nếu thiếu data symbol, show warning.  
9\. Suggested lot hiển thị lớn nhất.  
10\. Có nút copy final lot.  
11\. Responsive mobile/desktop.  
12\. Save preferences vào localStorage.

---

## **Task 8 — Manual override**

Bạn là frontend engineer.

Implement manual override.

File:  
\- /src/components/symbols/ManualSymbolOverride.tsx

Yêu cầu:  
1\. Cho phép override:  
   \- contractSize  
   \- tickSize  
   \- tickValue  
   \- minLot  
   \- maxLot  
   \- lotStep  
   \- commissionType  
   \- commissionValue  
2\. Lưu override trong localStorage theo symbol.  
3\. Calculator phải dùng override nếu có.  
4\. Show badge "Manual override active".  
5\. Có reset override.  
6\. Show warning:  
   "Verify these values in FTMO MT5 Market Watch → Specification before live trading."

---

## **Task 9 — Symbols page**

Bạn là frontend engineer.

Build symbols page.

Files:  
\- /src/app/symbols/page.tsx  
\- /src/components/symbols/SymbolSpecTable.tsx  
\- /src/components/symbols/SymbolSpecStatus.tsx

Yêu cầu:  
1\. Fetch data từ /api/symbols.  
2\. Table columns:  
   \- Symbol  
   \- Display Name  
   \- Asset Class  
   \- Platform  
   \- Contract Size  
   \- Tick Size  
   \- Tick Value  
   \- Min Lot  
   \- Max Lot  
   \- Lot Step  
   \- Commission Type  
   \- Commission Value  
   \- Complete?  
   \- Last Fetched  
   \- Warnings  
3\. Filters:  
   \- Search symbol  
   \- Crypto only  
   \- Complete only  
   \- Incomplete only  
4\. Highlight incomplete specs.  
5\. Show data freshness.  
6\. Responsive table.

---

## **Task 10 — Admin refresh page**

Bạn là frontend/backend engineer.

Build admin refresh page.

Files:  
\- /src/app/admin/page.tsx  
\- /src/components/admin/RefreshFTMODataButton.tsx

Yêu cầu:  
1\. Show cache metadata.  
2\. Button refresh FTMO data.  
3\. Button gọi POST /api/symbols/refresh.  
4\. Show refresh result:  
   \- success/failure  
   \- symbolsFound  
   \- completeSymbols  
   \- incompleteSymbols  
   \- usedFallbackCache  
   \- warnings  
   \- lastFetchedAt  
5\. Nếu refresh fail, show app đang dùng cache cũ.  
6\. Có disclaimer verify lại data trong MT5.

---

## **Task 11 — Tests and polish**

Bạn là QA engineer và senior product engineer.

Hoàn thiện testing và polish.

Tests bằng Vitest:  
1\. roundLotDown  
2\. calculateCommission none  
3\. calculateCommission fixed\_per\_lot  
4\. calculateCommission percent\_notional  
5\. calculateLotSize basic case  
6\. calculateLotSize with risk percent  
7\. calculateLotSize with fixed risk amount  
8\. long direction validation  
9\. short direction validation  
10\. missing tickSize  
11\. missing tickValue  
12\. missing lotStep  
13\. lot below minLot warning  
14\. lot above maxLot warning  
15\. normalizeFTMOSymbol  
16\. validateSymbolSpec  
17\. scraper failure fallback  
18\. cache fallback behavior

Polish:  
1\. Dark mode support  
2\. Loading states  
3\. Error states  
4\. Empty states  
5\. Better number formatting  
6\. SEO metadata:  
   title: FTMO Crypto Lot Size Calculator  
   description: Calculate MT5 lot size for FTMO crypto CFD trading based on account risk, entry price, stop loss, and symbol specifications.  
7\. Risk disclaimer  
8\. npm run lint pass  
9\. npm run test pass  
10\. npm run build pass

---

# **Prompt ngắn gọn nhất để bắt đầu ngay**

Nếu bạn chỉ muốn dán một prompt duy nhất cho Codex, dùng bản này:

Build a production-ready Next.js TypeScript web app called "FTMO Crypto Lot Calculator".

The app helps traders calculate MT5 lot size for FTMO crypto CFD instruments.

User inputs must be simple:  
\- Account Balance  
\- Risk % or Risk $  
\- Symbol  
\- Entry Price  
\- Stop Loss Price  
\- Direction: Long/Short

The app must obtain technical symbol specifications from a cached FTMO Symbols data layer:  
\- Contract Size  
\- Tick Size  
\- Tick Value  
\- Min Lot  
\- Max Lot  
\- Lot Step  
\- Commission if available

Implement:  
\- FTMO Symbols scraper  
\- Parser  
\- Normalizer  
\- Validator  
\- JSON cache  
\- API routes  
\- Calculator engine  
\- Calculator UI  
\- Symbols table page  
\- Admin refresh page  
\- Manual override with localStorage  
\- Tests with Vitest

Do not calculate lot if required fields are missing.  
Do not invent missing FTMO values.  
If scraper fails, use old cache.  
If symbol data is incomplete, show warnings and allow manual override.

Core formula:  
riskAmount \= accountBalance \* riskPercent / 100  
priceDistance \= abs(entryPrice \- stopLossPrice)  
ticksCount \= priceDistance / tickSize  
lossPerOneLot \= ticksCount \* tickValue  
rawLot \= riskAmount / lossPerOneLot  
roundedLot \= floor(rawLot / lotStep) \* lotStep

Support commission:  
\- none  
\- fixed\_per\_lot  
\- percent\_notional

For percent\_notional:  
notional \= lot \* contractSize \* entryPrice  
commissionOneSide \= notional \* commissionValue  
roundTurnCommission \= commissionOneSide \* 2

Make calculation conservative so total estimated risk does not exceed intended risk when commission is included.

Tech stack:  
\- Next.js App Router  
\- TypeScript  
\- TailwindCSS  
\- shadcn/ui  
\- React Hook Form  
\- Zod  
\- Vitest  
\- localStorage  
\- JSON cache

Pages:  
\- /  
\- /symbols  
\- /admin

API:  
\- GET /api/symbols  
\- GET /api/symbols?assetClass=crypto  
\- GET /api/symbols/\[symbol\]  
\- POST /api/symbols/refresh

Add disclaimer:  
This calculator is for estimation only. FTMO and MT5 symbol specifications may change. Users must verify Contract Size, Tick Size, Tick Value, Min Lot, Max Lot, Lot Step and Commission directly in FTMO MT5 Market Watch → Specification before live trading. This is not financial advice.

Ensure:  
npm run lint  
npm run test  
npm run build

All must pass.

---

