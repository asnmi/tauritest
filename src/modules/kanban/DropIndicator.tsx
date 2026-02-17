interface DropIndicatorProps {
  isVisible: boolean;
  position?: 'before' | 'after' | 'column';
}

const DropIndicator: React.FC<DropIndicatorProps> = ({ isVisible, position = 'before' }) => {
  if (!isVisible) return null;

  const baseStyles = 'h-1 bg-blue-500 transition-all duration-200';
  
  const positionStyles = {
    before: 'absolute top-0 left-0 right-0',
    after: 'absolute bottom-0 left-0 right-0',
    column: 'my-2 mx-0 w-full'
  };

  return (
    <div 
      className={`${baseStyles} ${positionStyles[position]}`}
      style={{
        opacity: isVisible ? 1 : 0,
        height: isVisible ? '2px' : '0',
        transition: 'all 150ms ease-out',
        transform: isVisible ? 'scaleX(1)' : 'scaleX(0.8)',
        transformOrigin: position === 'before' ? 'top' : 'bottom',
        boxShadow: '0 1px 3px rgba(74, 144, 226, 0.3)'
      }}
    />
  );
};

export default DropIndicator;