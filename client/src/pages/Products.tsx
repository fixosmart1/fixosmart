import { useLanguage } from "@/hooks/use-language";
import { useProducts } from "@/hooks/use-api";
import { ShoppingCart, Check } from "lucide-react";
import { Link } from "wouter";

export function Products() {
  const { t, language } = useLanguage();
  const { data: products = [], isLoading } = useProducts();

  const getLocalizedName = (product: any) => {
    if (language === 'bn') return product.nameBn;
    if (language === 'ar') return product.nameAr;
    return product.nameEn;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold">{t('smart_gadgets')}</h1>
        <p className="text-muted-foreground mt-2">Upgrade your home with the latest tech. Optional installation available.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-64 glass rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="glass rounded-2xl overflow-hidden flex flex-col group hover:shadow-xl transition-shadow">
              <div className="h-48 bg-muted relative overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={getLocalizedName(product)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                )}
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">Smart</div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg leading-tight mb-2 flex-1">{getLocalizedName(product)}</h3>
                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <span className="text-2xl font-display font-bold text-primary">{product.priceSar}</span>
                    <span className="text-sm text-muted-foreground ml-1">SAR</span>
                  </div>
                </div>
                <div className="text-xs text-success flex items-center gap-1 mt-2">
                  <Check size={14} /> Install available (+{product.installationFeeSar} SAR)
                </div>
                <Link 
                  href={`/booking?productId=${product.id}`}
                  className="mt-4 w-full py-2.5 bg-background border-2 border-primary text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <ShoppingCart size={18} /> Buy & Install
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
