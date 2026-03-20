import fs from 'fs';
import path from 'path';

const publicSvgDir = path.join(process.cwd(), 'public', 'svg');
const outFilePath = path.join(process.cwd(), 'components', 'ui', 'ModernIcons.tsx');
const files = fs.readdirSync(publicSvgDir).filter(f => f.endsWith('.svg'));

let outCode = `import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface IconProps extends HTMLMotionProps<"svg"> {
  size?: number | string;
  className?: string;
  isActive?: boolean;
}

`;

files.forEach(file => {
    const filePath = path.join(publicSvgDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Extract SVG Inner HTML and ViewBox
    const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";
    
    // Extract inner content
    let innerContent = content.substring(content.indexOf('>') + 1, content.lastIndexOf('</svg>'));
    
    // Clean up inner content
    innerContent = innerContent.replace(/fill="#(000000|1C274C|1C1C1C|222222)"/gi, 'fill="currentColor"');
    innerContent = innerContent.replace(/stroke="#(000000|1C274C|1C1C1C|222222)"/gi, 'stroke="currentColor"');

    // Remove any hardcoded width/height inside inner paths just in case
    innerContent = innerContent.replace(/width="[0-9]+(px)?"/g, '');
    innerContent = innerContent.replace(/height="[0-9]+(px)?"/g, '');
    
    // Convert style properties to React camelCase
    innerContent = innerContent.replace(/fill-rule/g, 'fillRule');
    innerContent = innerContent.replace(/clip-rule/g, 'clipRule');
    innerContent = innerContent.replace(/stroke-width/g, 'strokeWidth');
    innerContent = innerContent.replace(/stroke-linecap/g, 'strokeLinecap');
    innerContent = innerContent.replace(/stroke-linejoin/g, 'strokeLinejoin');
    innerContent = innerContent.replace(/stroke-miterlimit/g, 'strokeMiterlimit');
    innerContent = innerContent.replace(/clip-path/g, 'clipPath');

    // Replace <style> script blocks if any
    innerContent = innerContent.replace(/<style.*?>.*?<\/style>/gis, '');

    // Replace comment blocks
    innerContent = innerContent.replace(/<!--.*?-->/gs, '');

    // Replace <?xml ... ?> tags
    innerContent = innerContent.replace(/<\?xml.*?\?>/gs, '');

    // Replace standard style="" html tag to React style={{}}
    innerContent = innerContent.replace(/style="([^"]+)"/g, (match, styles) => {
        const styleObj = styles.split(';').filter(Boolean).reduce((acc, style) => {
            const [key, value] = style.split(':');
            const camelKey = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            acc.push(`${camelKey}: '${value.trim()}'`);
            return acc;
        }, []).join(', ');
        return `style={{${styleObj}}}`;
    });

    // Create a generic React component name
    let compName = file.replace('-svgrepo-com.svg', '').replace(/[^a-zA-Z0-9]/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Icon';
    
    if (compName === 'PhoneRoundedIcon 1') compName = 'PhoneRoundedIcon2';
    // Validate that it's a valid React component name
    if (!/^[A-Z]/.test(compName)) {
        compName = 'Icon' + compName;
    }

    outCode += `
export const ${compName}: React.FC<IconProps> = ({ size = 24, className = '', isActive, ...props }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="${viewBox}"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
    transition={{ duration: 0.3 }}
    {...props}
  >
    ${innerContent}
  </motion.svg>
);
`;
});

fs.writeFileSync(outFilePath, outCode);
console.log('Successfully generated ModernIcons.tsx with ' + files.length + ' icons.');
