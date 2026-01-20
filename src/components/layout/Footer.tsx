export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-center text-sm text-gray-500 space-y-2">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <span>Price Data: Exchange feeds via Yahoo Finance</span>
            <span>Beta: Yahoo Finance</span>
            <span>FX: ECB Reference Rates</span>
          </div>
          <p className="text-xs text-gray-400">
            Indicative data only. Not intended as trading or investment advice.
            Data may be delayed. Always verify with official sources before making investment decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
