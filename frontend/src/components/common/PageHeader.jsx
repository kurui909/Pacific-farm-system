// src/components/common/PageHeader.jsx
import { isValidElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';

/**
 * PageHeader - Modern page header with optional gradient title, actions, breadcrumbs
 * Fully responsive: smaller title on mobile, buttons wrap, breadcrumbs stack gracefully
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs = false,
  showBackButton = false,
  onBack,
  icon: Icon = null,
  gradientTitle = true,
}) {
  const location = useLocation();

  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return pathnames.map((value, index) => {
      const to = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
      return { label, to, isLast: index === pathnames.length - 1 };
    });
  };

  const breadcrumbItems =
    breadcrumbs === true ? generateBreadcrumbs() : Array.isArray(breadcrumbs) ? breadcrumbs : [];

  const renderAction = (action, index) => {
    if (!action) return null;

    if (typeof action === 'object' && action !== null && !isValidElement(action)) {
      const IconComp = action.icon;
      const variant = action.variant || 'secondary';

      const variantClasses = {
        primary:
          'bg-blue-600 hover:bg-blue-700 text-white shadow-sm focus:ring-2 focus:ring-blue-500',
        secondary:
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
        outline:
          'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
        ghost:
          'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
      };

      return (
        <button
          key={action.label ?? index}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantClasses[variant]}`}
        >
          {IconComp && <IconComp size={16} className="md:w-[18px] md:h-[18px]" />}
          {action.label}
        </button>
      );
    }

    return action;
  };

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbItems.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center text-xs md:text-sm">
          <Link
            to="/"
            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            aria-label="Home"
          >
            <Home size={14} />
          </Link>
          {breadcrumbItems.map((item) => (
            <div key={item.to} className="flex items-center">
              <ChevronRight size={14} className="mx-1 text-gray-400" />
              {item.isLast ? (
                <span className="text-gray-600 dark:text-gray-300 font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Main header row */}
      <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Optional icon circle – hidden on mobile */}
          {Icon && (
            <div className="hidden sm:flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
              <Icon size={18} className="md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1 md:gap-2">
              {showBackButton && (
                <button
                  onClick={onBack || (() => window.history.back())}
                  className="rounded-full p-1.5 md:p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Go back"
                >
                  <ArrowLeft size={18} className="md:w-5 md:h-5" />
                </button>
              )}
              <h1
                className={`text-xl md:text-3xl font-bold tracking-tight ${
                  gradientTitle
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions – wrap on small screens */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {Array.isArray(actions) ? actions.map(renderAction) : renderAction(actions)}
          </div>
        )}
      </div>
    </div>
  );
}