interface Attribute {
  trait_type: string;
  value: string;
}

interface AttributeTableProps {
  attributes: Attribute[];
}

export function AttributeTable({ attributes }: AttributeTableProps) {
  if (!attributes || attributes.length === 0) {
    return null;
  }

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-4">
      <h3 className="text-lg font-bold text-cyan-400 font-mono mb-4">Attributes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {attributes.map((attribute, index) => (
          <div
            key={index}
            className="bg-black/30 border border-gray-600 rounded-lg p-3 hover:border-cyan-400/50 transition-colors"
          >
            <div className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-1">
              {attribute.trait_type}
            </div>
            <div className="text-slate-100 font-mono font-semibold">
              {attribute.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
