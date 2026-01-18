"""Excel file parsing service for document preview."""

import csv
import io
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Try to import openpyxl, but provide fallback for missing dependency
try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False


# Maximum rows to preview (for performance)
MAX_PREVIEW_ROWS = 100


def parse_excel_to_json(
    file_path: Path,
    max_rows: int = MAX_PREVIEW_ROWS,
    sheet_index: int = 0,
) -> Dict[str, Any]:
    """
    Parse an Excel file and convert to JSON-compatible structure.

    Args:
        file_path: Path to the Excel file
        max_rows: Maximum number of rows to return
        sheet_index: Index of the sheet to preview (0-based)

    Returns:
        Dictionary with headers, rows, and metadata

    Raises:
        ValueError: If the file cannot be parsed
        ImportError: If openpyxl is not installed
    """
    if not HAS_OPENPYXL:
        raise ImportError(
            "openpyxl is required for Excel preview. "
            "Install with: pip install openpyxl"
        )

    try:
        # Open workbook in read-only mode for performance
        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)

        # Get the requested sheet
        sheet_names = wb.sheetnames
        if sheet_index >= len(sheet_names):
            sheet_index = 0

        sheet = wb.worksheets[sheet_index]
        sheet_name = sheet_names[sheet_index]

        # Extract headers from first row
        rows_iter = sheet.iter_rows(values_only=True)
        first_row = next(rows_iter, None)

        if first_row is None:
            return {
                "sheet_name": sheet_name,
                "headers": [],
                "rows": [],
                "total_rows": 0,
                "preview_rows": 0,
                "truncated": False,
            }

        # Convert headers to strings, handle None values
        headers = [str(h) if h is not None else f"Column_{i}" for i, h in enumerate(first_row)]

        # Extract data rows
        rows: List[Dict[str, Any]] = []
        total_rows = 0

        for row in rows_iter:
            total_rows += 1
            if len(rows) < max_rows:
                row_dict = {}
                for i, value in enumerate(row):
                    if i < len(headers):
                        # Convert value to JSON-serializable format
                        row_dict[headers[i]] = _convert_value(value)
                rows.append(row_dict)

        wb.close()

        return {
            "sheet_name": sheet_name,
            "headers": headers,
            "rows": rows,
            "total_rows": total_rows,
            "preview_rows": len(rows),
            "truncated": total_rows > max_rows,
        }

    except Exception as e:
        raise ValueError(f"Failed to parse Excel file: {str(e)}")


def parse_csv_to_json(
    file_path: Path,
    max_rows: int = MAX_PREVIEW_ROWS,
) -> Dict[str, Any]:
    """
    Parse a CSV file and convert to JSON-compatible structure.

    Args:
        file_path: Path to the CSV file
        max_rows: Maximum number of rows to return

    Returns:
        Dictionary with headers, rows, and metadata
    """
    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            # Try to detect dialect
            sample = f.read(8192)
            f.seek(0)

            try:
                dialect = csv.Sniffer().sniff(sample)
            except csv.Error:
                dialect = csv.excel  # Default dialect

            reader = csv.DictReader(f, dialect=dialect)
            headers = reader.fieldnames or []

            rows: List[Dict[str, Any]] = []
            total_rows = 0

            for row in reader:
                total_rows += 1
                if len(rows) < max_rows:
                    # Convert values
                    converted_row = {k: _convert_value(v) for k, v in row.items()}
                    rows.append(converted_row)

        return {
            "sheet_name": "CSV",
            "headers": list(headers),
            "rows": rows,
            "total_rows": total_rows,
            "preview_rows": len(rows),
            "truncated": total_rows > max_rows,
        }

    except Exception as e:
        raise ValueError(f"Failed to parse CSV file: {str(e)}")


def _convert_value(value: Any) -> Any:
    """
    Convert a cell value to a JSON-serializable format.

    Args:
        value: Cell value from Excel/CSV

    Returns:
        JSON-serializable value
    """
    if value is None:
        return None

    # Handle datetime
    if hasattr(value, 'isoformat'):
        return value.isoformat()

    # Handle numeric types
    if isinstance(value, (int, float)):
        # Handle infinity and NaN
        if isinstance(value, float):
            if value != value:  # NaN check
                return None
            if value == float('inf') or value == float('-inf'):
                return None
        return value

    # Convert everything else to string
    return str(value)


def get_preview_for_document(
    file_path: Path,
    file_format: str,
    max_rows: int = MAX_PREVIEW_ROWS,
) -> Tuple[str, Optional[Dict[str, Any]]]:
    """
    Get preview data for a document based on its format.

    Args:
        file_path: Path to the document file
        file_format: File format extension (xlsx, xls, pdf, csv)
        max_rows: Maximum rows for table preview

    Returns:
        Tuple of (preview_type, preview_data)
        - For Excel/CSV: ("table", {headers, rows, ...})
        - For PDF: ("pdf", None) - frontend will use iframe
        - For other: ("unsupported", None)
    """
    format_lower = file_format.lower()

    if format_lower in ("xlsx", "xls"):
        try:
            data = parse_excel_to_json(file_path, max_rows)
            return "table", data
        except (ImportError, ValueError) as e:
            # Return error info
            return "error", {"error": str(e)}

    elif format_lower == "csv":
        try:
            data = parse_csv_to_json(file_path, max_rows)
            return "table", data
        except ValueError as e:
            return "error", {"error": str(e)}

    elif format_lower == "pdf":
        # PDF preview is handled by frontend iframe
        return "pdf", None

    else:
        return "unsupported", None
