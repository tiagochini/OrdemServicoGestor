import { Link, useLocation } from "wouter";
import { 
  Home, 
  FileText, 
  Users, 
  Building, 
  Settings as SettingsIcon,
  DollarSign,
  Receipt,
  CreditCard,
  BarChart,
  Package,
  Tags
} from "lucide-react";

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ mobile = false, onClose }: SidebarProps) => {
  const [location] = useLocation();
  
  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      active: location === "/"
    },
    {
      name: "Ordens de Serviço",
      href: "/orders",
      icon: FileText,
      active: location.startsWith("/orders")
    },
    {
      name: "Técnicos",
      href: "/technicians",
      icon: Users,
      active: location.startsWith("/technicians")
    },
    {
      name: "Clientes",
      href: "/customers",
      icon: Building,
      active: location.startsWith("/customers")
    },
    {
      name: "Finanças",
      href: "/finance",
      icon: DollarSign,
      active: location.startsWith("/finance")
    },
    {
      name: "Catálogo",
      href: "/catalog",
      icon: Tags,
      active: location.startsWith("/catalog")
    },
    {
      name: "Configurações",
      href: "/settings",
      icon: SettingsIcon,
      active: location.startsWith("/settings")
    }
  ];

  return (
    <div className={`${mobile ? "" : "hidden lg:flex lg:flex-shrink-0"}`}>
      <div className="flex flex-col w-64 border-r border-gray-200 pt-5 pb-4 bg-white">
        <div className="flex items-center justify-center flex-shrink-0 px-4">
          <h1 className="text-xl font-semibold text-gray-800">OS Manager</h1>
        </div>
        <div className="mt-6 h-0 flex-1 flex flex-col overflow-y-auto">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.active 
                    ? "bg-primary text-white" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <item.icon 
                  className={`h-5 w-5 mr-3 ${
                    item.active ? "" : "text-gray-500"
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
