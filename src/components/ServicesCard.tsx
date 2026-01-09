import { ServiceType } from "@/./../type";

interface ServiceCardProps {
  service: ServiceType;
  className?: string;
}

const ServiceCard = ({ service, className }: ServiceCardProps) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden group ">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover rounded-xl"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            target.nextElementSibling?.classList.remove("hidden");
          }}
        />
        <div className="hidden w-full h-full flex items-center justify-center bg-light-bg">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        
       
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="font-semibold text-lg text-card-foreground group-hover:text-accent-color transition-colors duration-200 line-clamp-2 mb-3">
          {service.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
          {service.description}
        </p>
      </div>
    </div>
  );
};

export default ServiceCard;
