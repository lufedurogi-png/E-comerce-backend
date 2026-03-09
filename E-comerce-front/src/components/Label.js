const Label = ({ className = '', children, ...props }) => (
    <label
        className={`block font-medium text-sm ${className}`}
        {...props}>
        {children}
    </label>
)

export default Label
