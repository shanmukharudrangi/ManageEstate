import Icon from './Icon';

export default function BrandLogo({ compact = false, accent = 'default' }) {
  return (
    <div className={`brand-logo ${compact ? 'brand-logo-compact' : ''}`}>
      <div className={`brand-mark ${accent === 'light' ? 'brand-mark-light' : ''}`}>
        <Icon name="manage-estate-logo" size={22} />
      </div>
      <div>
        <p className="brand-overline">Estate Management</p>
        <h1 className="brand-title">{compact ? 'ManageEstate' : 'ManageEstate'}</h1>
      </div>
    </div>
  );
}
