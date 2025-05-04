import { Link, useLocation } from "wouter";
import { Home, FileText, Users, Building, Plus, DollarSign } from "lucide-react";
import { useState } from "react";
import OrderForm from "../orders/order-form";

const MobileNav = () => {
  const [location] = useLocation();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  
  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      active: location === "/"
    },
    {
      name: "OS",
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
    }
  ];

  return (
    <>
      <div className="lg:hidden fixed bottom-0 w-full border-t border-gray-200 bg-white">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex flex-col items-center py-3 px-4 ${
                item.active ? "text-primary" : "text-gray-500"
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{item.name}</span>
            </Link>
          ))}
          <button 
            className="flex flex-col items-center py-3 px-4 text-gray-500"
            onClick={() => setIsCreateFormOpen(true)}
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs">Nova OS</span>
          </button>
        </div>
      </div>

      {isCreateFormOpen && (
        <OrderForm 
          isOpen={isCreateFormOpen} 
          onClose={() => setIsCreateFormOpen(false)}
        />
      )}
    </>
  );
};

export default MobileNav;
