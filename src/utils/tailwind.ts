const styles = getComputedStyle(document.documentElement);

export const theme = (property: string) => styles.getPropertyValue(property);
